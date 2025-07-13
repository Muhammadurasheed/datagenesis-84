try:
    from pinecone import Pinecone, ServerlessSpec
    from sentence_transformers import SentenceTransformer
    VECTOR_DEPENDENCIES_AVAILABLE = True
except ImportError:
    VECTOR_DEPENDENCIES_AVAILABLE = False
    Pinecone = None
    ServerlessSpec = None
    SentenceTransformer = None

from typing import List, Dict, Any
import numpy as np
import json
import logging

from ..config import settings

logger = logging.getLogger(__name__)

class VectorService:
    def __init__(self):
        self.pinecone_client = None
        self.index = None
        self.embeddings_model = None
        self.is_initialized = False

        if not VECTOR_DEPENDENCIES_AVAILABLE:
            logger.warning("⚠️ Vector service dependencies not available. Install sentence-transformers and pinecone-client.")
        else:
            try:
                self.embeddings_model = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("✅ SentenceTransformer model loaded successfully")
            except Exception as e:
                logger.error(f"❌ Failed to load SentenceTransformer: {e}")
                self.embeddings_model = None

    async def initialize(self):
        """Initialize Pinecone connection and index"""
        if not VECTOR_DEPENDENCIES_AVAILABLE:
            logger.warning("⚠️ Vector service cannot initialize - dependencies missing")
            return False

        if not self.embeddings_model:
            logger.warning("⚠️ Vector service cannot initialize - SentenceTransformer model not loaded")
            return False

        try:
            # Create Pinecone client
            self.pinecone_client = Pinecone(api_key=settings.pinecone_api_key)

            # Check if index exists
            existing_indexes = self.pinecone_client.list_indexes().names()
            if settings.pinecone_index_name not in existing_indexes:
                # Create index if it doesn't exist
                self.pinecone_client.create_index(
                    name=settings.pinecone_index_name,
                    dimension=384,  # all-MiniLM-L6-v2 dimension
                    metric='cosine',
                    spec=ServerlessSpec(
                        cloud='aws',
                        region=settings.pinecone_region or 'us-west-2'  # set your default region
                    )
                )
                logger.info(f"✅ Created Pinecone index: {settings.pinecone_index_name}")

            # Get index handle
            self.index = self.pinecone_client.Index(settings.pinecone_index_name)
            self.is_initialized = True
            logger.info("✅ Pinecone vector database connected")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to initialize Pinecone: {e}")
            return False

    def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for given texts"""
        if not self.embeddings_model:
            raise RuntimeError("Embeddings model not available")
        return self.embeddings_model.encode(texts)

    async def store_dataset_embeddings(
        self,
        dataset_id: str,
        schema_data: Dict[str, Any],
        sample_data: List[Dict[str, Any]]
    ) -> bool:
        """Store dataset embeddings in Pinecone"""
        try:
            schema_text = json.dumps(schema_data)
            sample_texts = [json.dumps(row) for row in sample_data[:10]]

            all_texts = [schema_text] + sample_texts
            embeddings = self.generate_embeddings(all_texts)

            vectors = []

            # Schema embedding
            vectors.append({
                "id": f"{dataset_id}_schema",
                "values": embeddings[0].tolist(),
                "metadata": {
                    "dataset_id": dataset_id,
                    "type": "schema",
                    "content": schema_text[:1000]
                }
            })

            # Sample data embeddings
            for i, embedding in enumerate(embeddings[1:]):
                vectors.append({
                    "id": f"{dataset_id}_sample_{i}",
                    "values": embedding.tolist(),
                    "metadata": {
                        "dataset_id": dataset_id,
                        "type": "sample",
                        "content": sample_texts[i][:1000]
                    }
                })

            self.index.upsert(vectors=vectors)
            return True
        except Exception as e:
            logger.error(f"❌ Error storing embeddings: {e}")
            return False

    async def find_similar_datasets(
        self,
        query_schema: Dict[str, Any],
        query_samples: List[Dict[str, Any]],
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Find similar datasets based on schema"""
        try:
            query_text = json.dumps(query_schema)
            query_embedding = self.generate_embeddings([query_text])[0]

            results = self.index.query(
                vector=query_embedding.tolist(),
                top_k=top_k * 2,
                include_metadata=True,
                filter={"type": "schema"}
            )

            similar_datasets = []
            seen_datasets = set()

            for match in results.matches:
                dataset_id = match.metadata["dataset_id"]
                if dataset_id not in seen_datasets:
                    similar_datasets.append({
                        "dataset_id": dataset_id,
                        "similarity_score": match.score,
                        "metadata": match.metadata
                    })
                    seen_datasets.add(dataset_id)

                if len(similar_datasets) >= top_k:
                    break

            return similar_datasets
        except Exception as e:
            logger.error(f"❌ Error finding similar datasets: {e}")
            return []

    async def store_domain_patterns(
        self,
        domain: str,
        patterns: Dict[str, Any]
    ) -> bool:
        """Store domain-specific patterns"""
        try:
            pattern_text = json.dumps(patterns)
            embedding = self.generate_embeddings([pattern_text])[0]

            vector = {
                "id": f"domain_{domain}",
                "values": embedding.tolist(),
                "metadata": {
                    "type": "domain_pattern",
                    "domain": domain,
                    "patterns": pattern_text[:2000]
                }
            }

            self.index.upsert(vectors=[vector])
            return True
        except Exception as e:
            logger.error(f"❌ Error storing domain patterns: {e}")
            return False

    async def get_cross_domain_insights(
        self,
        target_domain: str,
        query_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Get cross-domain insights"""
        try:
            query_text = json.dumps(query_data)
            query_embedding = self.generate_embeddings([query_text])[0]

            results = self.index.query(
                vector=query_embedding.tolist(),
                top_k=10,
                include_metadata=True,
                filter={
                    "type": "domain_pattern",
                    "domain": {"$ne": target_domain}
                }
            )

            insights = []
            for match in results.matches:
                if match.score > 0.7:
                    insights.append({
                        "source_domain": match.metadata["domain"],
                        "similarity_score": match.score,
                        "applicable_patterns": json.loads(match.metadata["patterns"])
                    })

            return insights
        except Exception as e:
            logger.error(f"❌ Error getting cross-domain insights: {e}")
            return []

    async def cleanup_dataset_embeddings(self, dataset_id: str) -> bool:
        """Remove embeddings related to a dataset"""
        try:
            query_results = self.index.query(
                vector=[0] * 384,
                top_k=10000,
                include_metadata=True,
                filter={"dataset_id": dataset_id}
            )

            vector_ids = [match.id for match in query_results.matches]
            if vector_ids:
                self.index.delete(ids=vector_ids)

            return True
        except Exception as e:
            logger.error(f"❌ Error cleaning up embeddings: {e}")
            return False
