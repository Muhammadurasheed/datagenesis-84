"""
Ollama Service for Local AI Generation
Provides local AI capabilities using Ollama with Llama 3
"""

import asyncio
import json
import logging
import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid
import random

logger = logging.getLogger(__name__)

class OllamaService:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.model_name = "llama3.2:3b"  # Start with smaller model for memory constraints
        self.is_initialized = False
        # Much longer timeout for initial model loading and inference
        self.client = httpx.AsyncClient(timeout=httpx.Timeout(180.0, connect=10.0))
        
    def configure_model(self, model_name: str, base_url: str = None):
        """Configure Ollama model and endpoint"""
        self.model_name = model_name
        if base_url:
            self.base_url = base_url
            # Update client with longer timeout for model loading
            self.client = httpx.AsyncClient(timeout=httpx.Timeout(180.0, connect=10.0))
        # Re-initialize with new settings
        logger.info(f"🔧 Ollama configured: {model_name} at {self.base_url}")
        return True
        
    async def initialize(self):
        """Initialize Ollama service and check if model is available"""
        try:
            # Check if Ollama is running
            response = await self.client.get(f"{self.base_url}/api/tags")
            if response.status_code == 200:
                models_data = response.json()
                models = [model['name'] for model in models_data.get('models', [])]
                
                # Check if our default model is available
                if self.model_name in models:
                    self.is_initialized = True
                    logger.info(f"✅ Ollama service initialized with {self.model_name}")
                    return True
                else:
                    # Check for alternative models first
                    available_llama_models = [m for m in models if 'llama3' in m.lower()]
                    if available_llama_models:
                        # Use the first available Llama3 model
                        self.model_name = available_llama_models[0]
                        self.is_initialized = True
                        logger.info(f"✅ Ollama service initialized with available model: {self.model_name}")
                        return True
                    
                    # Check for any available models as fallback
                    if models:
                        logger.warning(f"⚠️ No Llama3 models found, using: {models[0]}")
                        self.model_name = models[0]
                        self.is_initialized = True
                        return True
                    else:
                        # Only pull if no suitable model found
                        logger.info(f"🔄 No models found. Pulling {self.model_name}...")
                        await self._pull_model(self.model_name)
                        self.is_initialized = True
                        logger.info(f"✅ Ollama service initialized with {self.model_name}")
                        return True
            else:
                logger.warning("⚠️ Ollama service not responding")
                return False
                
        except Exception as e:
            logger.warning(f"⚠️ Ollama service not available: {str(e)}")
            return False

    async def _pull_model(self, model_name: str):
        """Pull a model from Ollama registry"""
        try:
            response = await self.client.post(
                f"{self.base_url}/api/pull",
                json={"name": model_name}
            )
            if response.status_code == 200:
                logger.info(f"✅ Model {model_name} pulled successfully")
            else:
                logger.error(f"❌ Failed to pull model {model_name}")
        except Exception as e:
            logger.error(f"❌ Error pulling model: {str(e)}")

    async def health_check(self) -> Dict[str, Any]:
        """Check Ollama service health"""
        try:
            response = await self.client.get(f"{self.base_url}/api/tags")
            if response.status_code == 200:
                return {
                    "status": "online",
                    "message": f"Ollama service operational with {self.model_name}",
                    "quota_available": True,
                    "model": self.model_name
                }
            else:
                return {
                    "status": "error",
                    "message": "Ollama service not responding",
                    "quota_available": False
                }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Ollama connection failed: {str(e)}",
                "quota_available": False
            }

    async def generate_completion(self, prompt: str) -> str:
        """Generate text completion using Ollama with improved error handling"""
        if not self.is_initialized:
            raise Exception("Ollama service not initialized")
            
        try:
            # First ensure the model is loaded by checking if it exists
            logger.info(f"🔍 Checking if model {self.model_name} is available...")
            
            tags_response = await self.client.get(f"{self.base_url}/api/tags")
            if tags_response.status_code == 200:
                models_data = tags_response.json()
                available_models = [model['name'] for model in models_data.get('models', [])]
                
                if self.model_name not in available_models:
                    logger.error(f"❌ Model {self.model_name} not found. Available: {available_models}")
                    raise Exception(f"Model {self.model_name} not available. Available models: {available_models}")
            
            # Make generation request with proper parameters
            logger.info(f"🎯 Making generation request to {self.base_url}/api/generate")
            
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 1000,
                    "top_p": 0.9
                }
            }
            
            logger.info(f"📝 Request payload: {json.dumps(payload, indent=2)}")
            
            response = await self.client.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=httpx.Timeout(180.0)  # Extended timeout for model loading/inference
            )
            
            logger.info(f"📡 Response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                response_text = result.get('response', '')
                logger.info(f"✅ Generation successful, response length: {len(response_text)}")
                return response_text
            else:
                error_text = response.text
                logger.error(f"❌ Ollama API error {response.status_code}: {error_text}")
                
                # Check for memory issues and suggest smaller models
                if "memory" in error_text.lower() or response.status_code == 500:
                    try:
                        error_json = response.json()
                        if "memory" in error_json.get("error", "").lower():
                            small_models = ["llama3.2:1b", "llama3.2:3b", "phi3:3.8b", "qwen2.5:3b"]
                            raise Exception(f"Model requires more memory than available. Try smaller models: {', '.join(small_models)}")
                    except:
                        pass
                
                raise Exception(f"Ollama API error: {response.status_code} - {error_text}")
                
        except httpx.TimeoutException:
            logger.error("⏰ Request timeout - model might be slow to respond")
            raise Exception("Request timeout - try a smaller model or check Ollama performance")
        except httpx.ConnectError:
            logger.error("🔗 Connection error - Ollama might not be running")
            raise Exception("Cannot connect to Ollama - ensure it's running on the specified endpoint")
        except Exception as e:
            logger.error(f"❌ Ollama generation failed: {str(e)}")
            raise Exception(f"Local AI generation failed: {str(e)}")

    async def generate_schema_from_natural_language(
        self,
        description: str,
        domain: str = 'general',
        data_type: str = 'tabular'
    ) -> Dict[str, Any]:
        """Generate schema from natural language using Ollama"""
        if not self.is_initialized:
            raise Exception("Ollama service not initialized")
            
        prompt = f"""You are an expert data architect. Create a comprehensive database schema based on this description:

Description: "{description}"
Domain: {domain}
Data Type: {data_type}

Generate a realistic schema with proper field types, constraints, and examples.
Return your response as valid JSON in this exact format:

{{
    "schema": {{
        "field_name": {{
            "type": "string|number|boolean|date|datetime|email|phone|uuid",
            "description": "Field description",
            "constraints": {{"min": 0, "max": 100, "required": true}},
            "examples": ["example1", "example2", "example3"]
        }}
    }},
    "detected_domain": "{domain}",
    "estimated_rows": 100,
    "suggestions": ["Generation suggestions"]
}}

Make sure the schema is realistic and comprehensive for the described use case.
Response:"""
        
        try:
            response_text = await self.generate_completion(prompt)
            logger.info(f"🧹 Raw response from Ollama: {response_text[:500]}...")
            
            # Clean up the response with improved parsing
            cleaned_text = self._clean_and_extract_json(response_text)
            logger.info(f"🔍 Cleaned JSON text: {cleaned_text[:300]}...")
            
            # Try multiple parsing strategies
            parsed = None
            
            # Strategy 1: Direct JSON parsing
            try:
                parsed = json.loads(cleaned_text)
                logger.info("✅ Direct JSON parsing successful")
            except json.JSONDecodeError as e:
                logger.warning(f"⚠️ Direct parsing failed: {str(e)}")
                
                # Strategy 2: Fix common JSON issues
                try:
                    fixed_json = self._fix_common_json_issues(cleaned_text)
                    parsed = json.loads(fixed_json)
                    logger.info("✅ Fixed JSON parsing successful")
                except json.JSONDecodeError as e2:
                    logger.warning(f"⚠️ Fixed parsing failed: {str(e2)}")
                    
                    # Strategy 3: Extract and rebuild JSON structure
                    try:
                        parsed = self._extract_and_rebuild_json(cleaned_text)
                        logger.info("✅ Rebuilt JSON parsing successful")
                    except Exception as e3:
                        logger.error(f"❌ All parsing strategies failed: {str(e3)}")
                        raise Exception(f"Invalid JSON response from Ollama: {str(e)}")
            
            if not parsed:
                raise ValueError("Could not parse JSON response")
                
            return {
                'schema': parsed.get('schema', {}),
                'detected_domain': parsed.get('detected_domain', domain),
                'estimated_rows': parsed.get('estimated_rows', 100),
                'suggestions': parsed.get('suggestions', [])
            }
                
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parse error: {str(e)}")
            logger.error(f"❌ Problematic response: {response_text[:1000]}...")
            raise Exception(f"Invalid JSON response from Ollama: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Schema generation failed: {str(e)}")
            raise Exception(f"Local AI schema generation failed: {str(e)}")

    async def generate_synthetic_data(
        self,
        schema: Dict[str, Any],
        config: Dict[str, Any],
        description: str = "",
        source_data: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """Generate synthetic data using Ollama"""
        if not self.is_initialized:
            raise Exception("Ollama service not initialized")
            
        row_count = min(config.get('rowCount', 100), 100)  # Cap at 100 for performance
        domain = config.get('domain', 'general')
        
        # Include source data context if provided
        source_context = ""
        if source_data and len(source_data) > 0:
            source_context = f"\nSource Data Sample: {json.dumps(source_data[:2], indent=2)}"
        
        prompt = f"""You are an expert data generator. Generate {row_count} rows of REALISTIC synthetic data for {domain} domain.

Schema: {json.dumps(schema, indent=2)}
Description: {description}{source_context}

REQUIREMENTS:
1. Generate REALISTIC data - no placeholder text
2. Use proper {domain}-specific values
3. Ensure data diversity and realistic distributions
4. Follow schema constraints exactly
5. Return ONLY a JSON array of {row_count} objects

Example for healthcare: Use real medical conditions, realistic ages (18-95), proper patient IDs, etc.
Example for finance: Use realistic transaction amounts, proper account numbers, real bank names, etc.

Return ONLY the JSON array, no additional text.
Response:"""
        
        try:
            response_text = await self.generate_completion(prompt)
            
            # Clean and parse JSON with better error handling
            logger.info(f"🧹 Raw response preview: {response_text[:200]}...")
            
            # Remove markdown formatting
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0]
            elif '```' in response_text:
                response_text = response_text.split('```')[1]
            
            response_text = response_text.strip()
            
            # Try to find JSON array in the response
            start_idx = response_text.find('[')
            end_idx = response_text.rfind(']') + 1
            
            if start_idx == -1 or end_idx == -1:
                # Try to find JSON object instead
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                
                if start_idx == -1 or end_idx == -1:
                    logger.error(f"❌ No valid JSON found in response: {response_text[:500]}")
                    raise ValueError("No valid JSON found in response")
            
            json_str = response_text[start_idx:end_idx]
            logger.info(f"🔍 Extracted JSON string: {json_str[:200]}...")
            
            try:
                data = json.loads(json_str)
            except json.JSONDecodeError as e:
                logger.error(f"❌ JSON decode error: {str(e)}")
                logger.error(f"❌ Problematic JSON: {json_str}")
                # Try to fix common JSON issues
                json_str = json_str.replace("'", '"')  # Replace single quotes
                json_str = json_str.replace('\n', ' ')  # Remove newlines
                try:
                    data = json.loads(json_str)
                    logger.info("✅ Fixed JSON parsing after cleanup")
                except:
                    raise ValueError("JSON parsing failed even after cleanup")
                
                if isinstance(data, dict):
                    # If single object returned, expand to multiple records
                    data = [data]
                    
                if not isinstance(data, list) or len(data) == 0:
                    raise ValueError("Invalid data format")
                    
                # Validate and potentially expand data
                if len(data) < row_count:
                    logger.info(f"🔄 Expanding {len(data)} records to {row_count}")
                    data = self._expand_data_realistically(data, row_count, domain, schema)
                
                logger.info(f"✅ Generated {len(data)} realistic {domain} records")
                return data[:row_count]
            else:
                raise ValueError("No valid JSON array found in response")
                
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parse error: {str(e)}")
            raise Exception("Invalid JSON response from Ollama")
        except Exception as e:
            logger.error(f"❌ Synthetic data generation failed: {str(e)}")
            raise Exception(f"Local AI data generation failed: {str(e)}")

    def _expand_data_realistically(
        self, 
        sample_data: List[Dict], 
        target_count: int, 
        domain: str, 
        schema: Dict[str, Any]
    ) -> List[Dict]:
        """Expand sample data realistically based on domain patterns"""
        if not sample_data:
            raise Exception("No sample data to expand")
            
        expanded_data = []
        base_record = sample_data[0]
        
        # Domain-specific realistic data generators
        domain_generators = self._get_domain_generators(domain)
        
        for i in range(target_count):
            new_record = {}
            
            for field_name, field_info in schema.items():
                if field_name in base_record:
                    # Use domain-specific generators for realistic variation
                    new_record[field_name] = self._generate_realistic_field_value(
                        field_name, field_info, i, domain, domain_generators
                    )
                else:
                    new_record[field_name] = self._generate_realistic_field_value(
                        field_name, field_info, i, domain, domain_generators
                    )
            
            expanded_data.append(new_record)
        
        return expanded_data

    def _get_domain_generators(self, domain: str) -> Dict[str, Any]:
        """Get domain-specific realistic data generators"""
        generators = {
            'healthcare': {
                'conditions': [
                    'Hypertension', 'Type 2 Diabetes', 'Coronary Artery Disease', 
                    'Asthma', 'COPD', 'Depression', 'Anxiety Disorder', 'Arthritis',
                    'Migraine', 'Osteoporosis', 'Atrial Fibrillation', 'Pneumonia'
                ],
                'departments': [
                    'Emergency', 'Cardiology', 'Neurology', 'Orthopedics', 
                    'Gastroenterology', 'Pulmonology', 'Endocrinology', 'Psychiatry'
                ],
                'doctors': [
                    'Dr. Sarah Mitchell', 'Dr. James Chen', 'Dr. Maria Rodriguez',
                    'Dr. David Thompson', 'Dr. Lisa Wang', 'Dr. Michael Brown'
                ]
            },
            'finance': {
                'transaction_types': [
                    'Deposit', 'Withdrawal', 'Transfer', 'Payment', 'Interest',
                    'Fee', 'Refund', 'Purchase', 'Sale', 'Investment'
                ],
                'merchants': [
                    'Amazon', 'Walmart', 'Target', 'Starbucks', 'Shell',
                    'McDonald\'s', 'Home Depot', 'Best Buy', 'Costco'
                ],
                'categories': [
                    'Groceries', 'Gas', 'Restaurants', 'Entertainment', 'Shopping',
                    'Bills', 'Healthcare', 'Travel', 'Education', 'Investment'
                ]
            }
        }
        return generators.get(domain, {})

    def _generate_realistic_field_value(
        self, 
        field_name: str, 
        field_info: Dict[str, Any], 
        index: int, 
        domain: str,
        generators: Dict[str, Any]
    ) -> Any:
        """Generate realistic field values based on domain and field type"""
        field_type = field_info.get('type', 'string')
        constraints = field_info.get('constraints', {})
        examples = field_info.get('examples', [])
        
        # Use examples if available
        if examples and len(examples) > 0:
            return examples[index % len(examples)]
        
        # Field name pattern matching for realistic data
        field_lower = field_name.lower()
        
        # Healthcare-specific patterns
        if domain == 'healthcare':
            if 'patient' in field_lower and 'id' in field_lower:
                return f"PT{str(100000 + index).zfill(6)}"
            elif 'condition' in field_lower or 'diagnosis' in field_lower:
                return generators.get('conditions', ['Unknown'])[index % len(generators.get('conditions', ['Unknown']))]
            elif 'doctor' in field_lower or 'physician' in field_lower:
                return generators.get('doctors', ['Dr. Unknown'])[index % len(generators.get('doctors', ['Dr. Unknown']))]
            elif 'department' in field_lower:
                return generators.get('departments', ['General'])[index % len(generators.get('departments', ['General']))]
            elif 'age' in field_lower:
                return random.randint(18, 95)  # Realistic age range
        
        # Finance-specific patterns
        elif domain == 'finance':
            if 'account' in field_lower and 'id' in field_lower:
                return f"ACC{str(1000000 + index).zfill(8)}"
            elif 'amount' in field_lower or 'balance' in field_lower:
                return round(random.uniform(10.0, 50000.0), 2)
            elif 'merchant' in field_lower:
                return generators.get('merchants', ['Unknown Merchant'])[index % len(generators.get('merchants', ['Unknown Merchant']))]
            elif 'category' in field_lower:
                return generators.get('categories', ['Miscellaneous'])[index % len(generators.get('categories', ['Miscellaneous']))]
        
        # Generic realistic patterns
        if 'name' in field_lower and 'file' not in field_lower:
            names = [
                'Alex Johnson', 'Sarah Williams', 'Michael Brown', 'Emma Davis',
                'James Wilson', 'Olivia Moore', 'William Taylor', 'Sophia Anderson',
                'Benjamin Jackson', 'Isabella Martinez', 'Lucas Garcia', 'Mia Rodriguez'
            ]
            return names[index % len(names)]
        elif 'email' in field_lower:
            domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com']
            return f"user{index + 1}@{domains[index % len(domains)]}"
        elif 'phone' in field_lower:
            return f"+1-{random.randint(200,999)}-{random.randint(100,999)}-{random.randint(1000,9999)}"
        elif 'address' in field_lower:
            streets = ['Main St', 'Oak Ave', 'Pine Rd', 'Elm Dr', 'Cedar Ln']
            return f"{random.randint(100, 9999)} {streets[index % len(streets)]}, City, State {random.randint(10000, 99999)}"
        
        # Type-based generation
        if field_type in ['number', 'integer']:
            min_val = constraints.get('min', 1)
            max_val = constraints.get('max', 1000)
            return random.randint(min_val, max_val)
        elif field_type == 'boolean':
            return random.choice([True, False])
        elif field_type in ['date', 'datetime']:
            from datetime import datetime, timedelta
            base_date = datetime.now() - timedelta(days=random.randint(1, 365))
            if field_type == 'date':
                return base_date.strftime('%Y-%m-%d')
            else:
                return base_date.isoformat()
        elif field_type == 'uuid':
            return str(uuid.uuid4())
        else:
            # Avoid generic "Sample" text
            return f"{field_name.replace('_', ' ').title()} {index + 1}"

    def _clean_and_extract_json(self, text: str) -> str:
        """Clean and extract JSON from AI response"""
        # Remove markdown formatting
        if '```json' in text:
            text = text.split('```json')[1].split('```')[0]
        elif '```' in text:
            text = text.split('```')[1]
        
        # Clean up the text
        text = text.strip()
        
        # Find JSON object boundaries
        start_idx = text.find('{')
        end_idx = text.rfind('}') + 1
        
        if start_idx != -1 and end_idx > start_idx:
            return text[start_idx:end_idx]
        
        return text

    def _fix_common_json_issues(self, json_str: str) -> str:
        """Fix common JSON formatting issues"""
        import re
        
        # Replace single quotes with double quotes (but not inside strings)
        json_str = re.sub(r"'([^']*)':", r'"\1":', json_str)
        json_str = re.sub(r": '([^']*)'", r': "\1"', json_str)
        
        # Fix trailing commas
        json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
        
        # Fix missing quotes around keys
        json_str = re.sub(r'([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', json_str)
        
        # Remove comments
        json_str = re.sub(r'//.*?\n', '\n', json_str)
        json_str = re.sub(r'/\*.*?\*/', '', json_str, flags=re.DOTALL)
        
        # Clean up whitespace
        json_str = ' '.join(json_str.split())
        
        return json_str

    def _extract_and_rebuild_json(self, text: str) -> Dict[str, Any]:
        """Extract and rebuild JSON structure from malformed text"""
        import re
        
        # Try to extract key-value pairs manually
        result = {"schema": {}, "detected_domain": "general", "estimated_rows": 100, "suggestions": []}
        
        # Extract schema section
        schema_match = re.search(r'"schema"\s*:\s*\{([^}]+)\}', text, re.DOTALL)
        if schema_match:
            schema_content = schema_match.group(1)
            # Parse field definitions
            field_matches = re.findall(r'"([^"]+)"\s*:\s*\{([^}]+)\}', schema_content)
            for field_name, field_content in field_matches:
                field_data = {}
                
                # Extract type
                type_match = re.search(r'"type"\s*:\s*"([^"]+)"', field_content)
                if type_match:
                    field_data["type"] = type_match.group(1)
                
                # Extract description
                desc_match = re.search(r'"description"\s*:\s*"([^"]+)"', field_content)
                if desc_match:
                    field_data["description"] = desc_match.group(1)
                
                # Extract examples
                examples_match = re.search(r'"examples"\s*:\s*\[([^\]]+)\]', field_content)
                if examples_match:
                    examples_str = examples_match.group(1)
                    examples = re.findall(r'"([^"]+)"', examples_str)
                    field_data["examples"] = examples
                
                # Set constraints
                field_data["constraints"] = {"required": True}
                
                result["schema"][field_name] = field_data
        
        # Extract other fields
        domain_match = re.search(r'"detected_domain"\s*:\s*"([^"]+)"', text)
        if domain_match:
            result["detected_domain"] = domain_match.group(1)
        
        rows_match = re.search(r'"estimated_rows"\s*:\s*(\d+)', text)
        if rows_match:
            result["estimated_rows"] = int(rows_match.group(1))
        
        # Extract suggestions
        suggestions_match = re.search(r'"suggestions"\s*:\s*\[([^\]]+)\]', text)
        if suggestions_match:
            suggestions_str = suggestions_match.group(1)
            suggestions = re.findall(r'"([^"]+)"', suggestions_str)
            result["suggestions"] = suggestions
        
        return result

    async def analyze_data_comprehensive(
        self,
        data: List[Dict[str, Any]],
        schema: Dict[str, Any],
        config: Dict[str, Any],
        description: str = ""
    ) -> Dict[str, Any]:
        """Comprehensive data analysis using Ollama"""
        if not self.is_initialized:
            raise Exception("Ollama service not initialized")
            
        if not data:
            raise Exception("No data provided for analysis")
        
        prompt = f"""You are a data analysis expert. Analyze this dataset comprehensively:

Sample Data: {json.dumps(data[:5], indent=2)}
Schema: {json.dumps(schema, indent=2)}
Description: {description}

Provide analysis in JSON format:
{{
    "domain": "healthcare|finance|retail|education|general",
    "confidence": 0-100,
    "data_quality": {{"score": 0-100, "issues": []}},
    "patterns": ["pattern1", "pattern2"],
    "relationships": ["rel1", "rel2"],
    "recommendations": ["rec1", "rec2"]
}}

Response:"""
        
        try:
            response_text = await self.generate_completion(prompt)
            
            # Clean up the response
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0]
            elif '```' in response_text:
                response_text = response_text.split('```')[1]
            
            response_text = response_text.strip()
            
            # Try to find JSON in the response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                raise ValueError("No valid JSON found in response")
                
        except Exception as e:
            logger.error(f"❌ Data analysis failed: {str(e)}")
            raise Exception(f"Local AI analysis failed: {str(e)}")

    async def detect_bias_comprehensive(
        self,
        data: List[Dict[str, Any]],
        config: Dict[str, Any],
        domain_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Comprehensive bias detection using Ollama"""
        if not self.is_initialized:
            raise Exception("Ollama service not initialized")
            
        if not data:
            raise Exception("No data provided for bias detection")
        
        prompt = f"""You are a bias detection expert. Analyze this dataset for potential bias:

Sample Data: {json.dumps(data[:5], indent=2)}
Domain Context: {json.dumps(domain_context, indent=2)}

Analyze for:
1. Demographic bias
2. Selection bias  
3. Confirmation bias
4. Historical bias
5. Representation bias

Provide analysis in JSON format:
{{
    "bias_score": 0-100,
    "detected_biases": ["bias1", "bias2"],
    "bias_types": ["demographic", "selection"],
    "recommendations": ["rec1", "rec2"],
    "mitigation_strategies": ["strategy1", "strategy2"]
}}

Response:"""
        
        try:
            response_text = await self.generate_completion(prompt)
            
            # Clean up the response
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0]
            elif '```' in response_text:
                response_text = response_text.split('```')[1]
            
            response_text = response_text.strip()
            
            # Try to find JSON in the response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                raise ValueError("No valid JSON found in response")
                
        except Exception as e:
            logger.error(f"❌ Bias detection failed: {str(e)}")
            raise Exception(f"Local AI bias detection failed: {str(e)}")

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()