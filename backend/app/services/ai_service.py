
"""
Multi-provider AI service for DataGenesis
Production-ready with no cached placeholders
"""

import json
import logging
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
import aiohttp
import google.generativeai as genai
from ..config import settings
from .quota_manager import quota_manager
import random
import uuid

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.current_provider = None
        self.current_model = None
        self.api_key = None
        self.endpoint = None
        self.is_initialized = False
        self._gemini_fallback = None
        
    async def initialize(self):
        """Initialize AI service with quota management and fallback services"""
        logger.info("🚀 Initializing AI Service...")
        
        # Initialize quota manager
        await quota_manager.initialize()
        
        # Initialize fallback services
        await self.initialize_fallback()
        
        logger.info("✅ AI Service initialized with quota management")
        return True
        
    async def initialize_fallback(self):
        """Initialize Gemini as fallback service"""
        try:
            # Import here to avoid circular imports
            from .gemini_service import GeminiService
            self._gemini_fallback = GeminiService()
            await self._gemini_fallback.initialize()
            logger.info("✅ Gemini fallback service initialized")
            return True
        except Exception as e:
            logger.warning(f"⚠️ Could not initialize Gemini fallback: {str(e)}")
            return False
        
    async def configure(self, provider: str, model: str, api_key: str, endpoint: str = None):
        """Configure the AI service with provider-specific settings"""
        self.current_provider = provider
        self.current_model = model
        self.api_key = api_key
        self.endpoint = endpoint
        
        try:
            if provider == 'gemini':
                await self._configure_gemini()
            elif provider == 'openai':
                await self._configure_openai()
            elif provider == 'anthropic':
                await self._configure_anthropic()
            elif provider == 'ollama':
                await self._configure_ollama()
            else:
                raise ValueError(f"Unsupported provider: {provider}")
                
            self.is_initialized = True
            logger.info(f"✅ AI Service configured for {provider} with model {model}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to configure {provider}: {str(e)}")
            self.is_initialized = False
            return False
    
    async def _configure_gemini(self):
        """Configure Google Gemini"""
        genai.configure(api_key=self.api_key)
        self.client = genai.GenerativeModel(self.current_model)
        
    async def _configure_openai(self):
        """Configure OpenAI"""
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        self.base_url = 'https://api.openai.com/v1'
        
    async def _configure_anthropic(self):
        """Configure Anthropic Claude"""
        self.headers = {
            'x-api-key': self.api_key,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
        }
        self.base_url = 'https://api.anthropic.com/v1'
        
    async def _configure_ollama(self):
        """Configure Ollama"""
        self.base_url = self.endpoint or 'http://localhost:11434'
        self.headers = {'Content-Type': 'application/json'}
        
        # Configure ollama service instance
        from .ollama_service import OllamaService
        if not hasattr(self, '_ollama_service'):
            self._ollama_service = OllamaService(self.base_url)
        
        # Configure the specific model and endpoint
        self._ollama_service.configure_model(self.current_model, self.base_url)
        
        # Initialize the ollama service
        await self._ollama_service.initialize()
    
    async def health_check(self) -> Dict[str, Any]:
        """Check AI service health - NO CACHING"""
        if not self.is_initialized:
            return {
                "status": "error",
                "message": "Service not configured",
                "provider": self.current_provider,
                "model": self.current_model
            }
        
        try:
            if self.current_provider == 'gemini':
                return await self._health_check_gemini()
            elif self.current_provider == 'openai':
                return await self._health_check_openai()
            elif self.current_provider == 'anthropic':
                return await self._health_check_anthropic()
            elif self.current_provider == 'ollama':
                return await self._health_check_ollama()
                
        except Exception as e:
            return {
                "status": "error", 
                "message": str(e),
                "provider": self.current_provider,
                "model": self.current_model
            }
    
    async def _health_check_gemini(self):
        """Gemini health check - REAL API CALL"""
        try:
            response = await asyncio.wait_for(
                asyncio.to_thread(self.client.generate_content, "test"),
                timeout=10
            )
            return {
                "status": "online",
                "provider": "gemini",
                "model": self.current_model,
                "message": "Connection successful"
            }
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                return {
                    "status": "quota_exceeded",
                    "provider": "gemini", 
                    "model": self.current_model,
                    "message": f"Quota exceeded: {str(e)}"
                }
            raise e
    
    async def _health_check_openai(self):
        """OpenAI health check"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/models",
                headers=self.headers
            ) as response:
                if response.status == 200:
                    return {
                        "status": "online",
                        "provider": "openai",
                        "model": self.current_model,
                        "message": "Connection successful"
                    }
                else:
                    raise Exception(f"HTTP {response.status}: {await response.text()}")
    
    async def _health_check_anthropic(self):
        """Anthropic health check"""
        return {
            "status": "ready",
            "provider": "anthropic",
            "model": self.current_model,
            "message": "Configured and ready"
        }
    
    async def _health_check_ollama(self):
        """Ollama health check"""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/api/tags") as response:
                if response.status == 200:
                    data = await response.json()
                    models = [m['name'] for m in data.get('models', [])]
                    return {
                        "status": "online",
                        "provider": "ollama",
                        "model": self.current_model,
                        "message": "Connection successful",
                        "available_models": models
                    }
                else:
                    raise Exception(f"HTTP {response.status}: {await response.text()}")
    
    async def generate_schema_from_natural_language(
        self,
        description: str,
        domain: str = 'general',
        data_type: str = 'tabular'
    ) -> Dict[str, Any]:
        """Generate schema from natural language description with fallback"""
        
        # Try configured service first
        if self.is_initialized:
            try:
                prompt = self._build_schema_prompt(description, domain, data_type)
                
                if self.current_provider == 'gemini':
                    return await self._generate_schema_gemini(prompt)
                elif self.current_provider == 'openai':
                    return await self._generate_schema_openai(prompt)
                elif self.current_provider == 'anthropic':
                    return await self._generate_schema_anthropic(prompt)
                elif self.current_provider == 'ollama':
                    return await self._generate_schema_ollama(prompt)
                else:
                    raise Exception(f"Schema generation not supported for {self.current_provider}")
            except Exception as e:
                logger.warning(f"⚠️ Primary AI service failed, trying fallback: {str(e)}")
        
        # Fallback to Gemini if primary service not available or failed
        if self._gemini_fallback:
            logger.info("🔄 Using Gemini fallback for schema generation")
            return await self._gemini_fallback.generate_schema_from_natural_language(
                description, domain, data_type
            )
        else:
            raise Exception("No AI service available and fallback not initialized")
    
    def _build_schema_prompt(self, description: str, domain: str, data_type: str) -> str:
        """Build schema generation prompt"""
        return f"""
        Based on this natural language description, generate a detailed database schema:
        
        Description: "{description}"
        Domain: {domain}
        Data Type: {data_type}
        
        Please create a comprehensive schema with:
        1. Realistic field names that match the described data
        2. Appropriate data types (string, number, boolean, date, email, phone, etc.)
        3. Constraints where applicable (min/max values, required fields)
        4. Sample values or examples for each field
        5. Domain-specific field suggestions
        
        Return the response as JSON with this exact structure:
        {{
            "schema": {{
                "field_name": {{
                    "type": "string|number|boolean|date|datetime|email|phone|uuid|text",
                    "description": "Clear description of the field",
                    "constraints": {{
                        "min": number,
                        "max": number,
                        "required": boolean,
                        "unique": boolean
                    }},
                    "examples": ["example1", "example2", "example3"]
                }}
            }},
            "detected_domain": "detected_domain_from_description",
            "estimated_rows": 100,
            "relationships": ["description of data relationships"],
            "suggestions": ["suggestions for data generation"]
        }}
        """
    
    async def _generate_schema_gemini(self, prompt: str) -> Dict[str, Any]:
        """Generate schema using Gemini"""
        response = await asyncio.to_thread(self.client.generate_content, prompt)
        return self._parse_json_response(response.text)
    
    async def _generate_schema_openai(self, prompt: str) -> Dict[str, Any]:
        """Generate schema using OpenAI"""
        async with aiohttp.ClientSession() as session:
            payload = {
                "model": self.current_model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7
            }
            
            async with session.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    text = data['choices'][0]['message']['content']
                    return self._parse_json_response(text)
                else:
                    raise Exception(f"OpenAI API error: {response.status}")
    
    async def _generate_schema_anthropic(self, prompt: str) -> Dict[str, Any]:
        """Generate schema using Anthropic Claude"""
        async with aiohttp.ClientSession() as session:
            payload = {
                "model": self.current_model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 4000
            }
            
            async with session.post(
                f"{self.base_url}/messages",
                headers=self.headers,
                json=payload
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    text = data['content'][0]['text']
                    return self._parse_json_response(text)
                else:
                    raise Exception(f"Anthropic API error: {response.status}")
    
    async def _generate_schema_ollama(self, prompt: str) -> Dict[str, Any]:
        """Generate schema using Ollama"""
        if hasattr(self, '_ollama_service') and self._ollama_service.is_initialized:
            # Extract description from prompt properly
            description = "user profile data"
            if 'Description: "' in prompt:
                try:
                    description = prompt.split('Description: "')[1].split('"')[0]
                except:
                    pass
            
            return await self._ollama_service.generate_schema_from_natural_language(
                description,
                "general",
                "tabular"
            )
        else:
            # Fallback to direct API call
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": self.current_model,
                    "prompt": prompt,
                    "stream": False
                }
                
                async with session.post(
                    f"{self.base_url}/api/generate",
                    headers=self.headers,
                    json=payload
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        text = data['response']
                        return self._parse_json_response(text)
                    else:
                        raise Exception(f"Ollama API error: {response.status}")
    
    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """Parse JSON response from AI models"""
        try:
            # Clean up the response
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0]
            elif '```' in text:
                text = text.split('```')[1]
            
            text = text.strip()
            parsed = json.loads(text)
            
            return {
                'schema': parsed.get('schema', {}),
                'detected_domain': parsed.get('detected_domain', 'general'),
                'estimated_rows': parsed.get('estimated_rows', 100),
                'relationships': parsed.get('relationships', []),
                'suggestions': parsed.get('suggestions', [])
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {str(e)}")
            logger.error(f"Response text: {text}")
            raise Exception("Invalid JSON response from AI model")

    async def generate_synthetic_data(
        self,
        schema: Dict[str, Any],
        config: Dict[str, Any],
        description: str = "",
        source_data: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """Generate synthetic data using the configured AI provider"""
        if not self.is_initialized:
            raise Exception("AI service not configured")
        
        try:
            if self.current_provider == 'gemini':
                return await self._generate_data_gemini(schema, config, description, source_data)
            elif self.current_provider == 'openai':
                return await self._generate_data_openai(schema, config, description, source_data)
            elif self.current_provider == 'anthropic':
                return await self._generate_data_anthropic(schema, config, description, source_data)
            elif self.current_provider == 'ollama':
                return await self._generate_data_ollama(schema, config, description, source_data)
            else:
                raise Exception(f"Unsupported provider: {self.current_provider}")
        except Exception as e:
            logger.error(f"❌ Data generation failed with {self.current_provider}: {str(e)}")
            # Try fallback to Gemini if available
            if self._gemini_fallback and self.current_provider != 'gemini':
                logger.info("🔄 Falling back to Gemini service")
                return await self._gemini_fallback.generate_synthetic_data(schema, config, description, source_data)
            raise Exception(f"Data generation failed: {str(e)}")

    async def _generate_data_ollama(
        self,
        schema: Dict[str, Any],
        config: Dict[str, Any],
        description: str = "",
        source_data: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """Generate data using Ollama"""
        from .ollama_service import OllamaService
        ollama_service = OllamaService(self.endpoint or "http://localhost:11434")
        ollama_service.configure_model(self.current_model, self.endpoint)
        await ollama_service.initialize()
        
        return await ollama_service.generate_synthetic_data(schema, config, description, source_data)

    async def _generate_data_gemini(
        self,
        schema: Dict[str, Any],
        config: Dict[str, Any],
        description: str = "",
        source_data: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """Generate data using Gemini"""
        # Build comprehensive prompt for data generation
        row_count = min(config.get('rowCount', 100), 100)
        source_context = ""
        if source_data and len(source_data) > 0:
            source_context = f"\nExample data: {json.dumps(source_data[:2], indent=2)}"
        
        prompt = f"""Generate {row_count} rows of REALISTIC synthetic data.
        
Schema: {json.dumps(schema, indent=2)}
Description: {description}{source_context}

REQUIREMENTS:
1. Generate REALISTIC data - no placeholder text
2. Use proper domain-specific values
3. Ensure data diversity and realistic distributions
4. Follow schema constraints exactly
5. Return ONLY a JSON array of {row_count} objects

Return ONLY the JSON array, no additional text."""
        
        # Use the configured Gemini client
        response = await asyncio.to_thread(self.client.generate_content, prompt)
        
        # Parse and return the response
        return self._parse_data_response(response.text, config)

    def _parse_data_response(self, text: str, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse and clean data generation response"""
        try:
            # Clean up the response
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0]
            elif '```' in text:
                text = text.split('```')[1]
            
            text = text.strip()
            
            # Try to find JSON array
            start_idx = text.find('[')
            end_idx = text.rfind(']') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_str = text[start_idx:end_idx]
                data = json.loads(json_str)
                
                if isinstance(data, list):
                    return data[:config.get('rowCount', 100)]
                else:
                    return [data]  # Convert single object to array
            else:
                raise ValueError("No valid JSON array found in response")
                
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parse error: {str(e)}")
            raise Exception("Invalid JSON response from AI model")
        except Exception as e:
            logger.error(f"❌ Data parsing failed: {str(e)}")
            raise Exception(f"Data response parsing failed: {str(e)}")

    async def generate_synthetic_data_advanced(
        self,
        schema: Dict[str, Any],
        config: Dict[str, Any],
        description: str = ""
    ) -> List[Dict[str, Any]]:
        """Generate high-quality synthetic data with fallback"""
        
        # Cap row count at 100 for quota management
        config['rowCount'] = min(config.get('rowCount', 100), 100)
        
        # Try configured service first
        if self.is_initialized:
            try:
                prompt = self._build_data_generation_prompt(schema, config, description)
                
                if self.current_provider == 'gemini':
                    return await self._generate_data_gemini(prompt, config)
                elif self.current_provider == 'openai':
                    return await self._generate_data_openai(prompt, config)
                elif self.current_provider == 'anthropic':
                    return await self._generate_data_anthropic(prompt, config)
                elif self.current_provider == 'ollama':
                    return await self._generate_data_ollama(prompt, config)
                else:
                    raise Exception(f"Data generation not supported for {self.current_provider}")
            except Exception as e:
                logger.warning(f"⚠️ Primary AI service failed, trying fallback: {str(e)}")
        
        # Fallback to Gemini if primary service not available or failed
        if self._gemini_fallback:
            logger.info("🔄 Using Gemini fallback for data generation")
            return await self._gemini_fallback.generate_synthetic_data_advanced(
                schema, config, description
            )
        else:
            raise Exception("No AI service available and fallback not initialized")

    def _build_data_generation_prompt(self, schema: Dict[str, Any], config: Dict[str, Any], description: str) -> str:
        """Build comprehensive data generation prompt"""
        row_count = config.get('rowCount', 100)
        domain = config.get('domain', 'general')
        quality_level = config.get('quality_level', 'high')
        
        return f"""
        Generate {row_count} rows of REALISTIC, production-ready synthetic data:
        
        Schema: {json.dumps(schema, indent=2)}
        
        Context:
        - Domain: {domain}
        - Description: {description}
        - Quality Level: {quality_level}
        - Target Use: Model training and enterprise applications
        
        CRITICAL REQUIREMENTS:
        1. Generate REALISTIC data that matches the {domain} domain
        2. NO placeholder text like "Sample X" or generic patterns
        3. Use authentic {domain}-specific values
        4. Ensure proper data relationships and constraints
        5. Realistic age ranges (18-95), proper IDs, real conditions/categories
        
        Return ONLY a JSON array of {row_count} objects, no additional text.
        """

    async def _generate_data_gemini(self, prompt: str, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate data using Gemini"""
        response = await asyncio.to_thread(self.client.generate_content, prompt)
        return self._parse_data_response(response.text, config)

    async def _generate_data_openai(self, prompt: str, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate data using OpenAI"""
        async with aiohttp.ClientSession() as session:
            payload = {
                "model": self.current_model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7
            }
            
            async with session.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    text = data['choices'][0]['message']['content']
                    return self._parse_data_response(text, config)
                else:
                    raise Exception(f"OpenAI API error: {response.status}")

    async def _generate_data_anthropic(self, prompt: str, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate data using Anthropic Claude"""
        async with aiohttp.ClientSession() as session:
            payload = {
                "model": self.current_model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 8000
            }
            
            async with session.post(
                f"{self.base_url}/messages",
                headers=self.headers,
                json=payload
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    text = data['content'][0]['text']
                    return self._parse_data_response(text, config)
                else:
                    raise Exception(f"Anthropic API error: {response.status}")

    async def _generate_data_ollama(self, prompt: str, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate data using Ollama"""
        if hasattr(self, '_ollama_service') and self._ollama_service.is_initialized:
            # Extract schema from prompt (simplified)
            schema = {}
            description = ""
            try:
                # Try to parse schema from prompt
                if "Schema:" in prompt:
                    schema_part = prompt.split("Schema:")[1].split("Context:")[0].strip()
                    import json
                    schema = json.loads(schema_part)
            except:
                schema = {"name": {"type": "string", "examples": ["John Doe"]}}
            
            return await self._ollama_service.generate_synthetic_data(
                schema, config, description, None
            )
        else:
            # Fallback to direct API call
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": self.current_model,
                    "prompt": prompt,
                    "stream": False
                }
                
                async with session.post(
                    f"{self.base_url}/api/generate",
                    headers=self.headers,
                    json=payload
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        text = data['response']
                        return self._parse_data_response(text, config)
                    else:
                        raise Exception(f"Ollama API error: {response.status}")

    def _parse_data_response(self, text: str, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse data generation response"""
        try:
            # Clean up the response
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0]
            elif '```' in text:
                text = text.split('```')[1]
            
            text = text.strip()
            data = json.loads(text)
            
            # Validate the response
            if not isinstance(data, list):
                raise ValueError("Response must be a JSON array")
            
            if len(data) == 0:
                raise ValueError("No data generated")
            
            logger.info(f"✅ Successfully generated {len(data)} realistic records")
            return data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse data response: {str(e)}")
            logger.error(f"Response text: {text[:500]}...")
            raise Exception("Invalid JSON response from AI model")

    async def generate_synthetic_data_with_quota(
        self,
        schema: Dict[str, Any],
        config: Dict[str, Any],
        description: str = "",
        user_id: str = "guest"
    ) -> List[Dict[str, Any]]:
        """Generate synthetic data with quota management and intelligent fallback"""
        
        if not schema:
            raise Exception("Schema is required for data generation")
            
        # Cap row count for quota management
        row_count = min(config.get('rowCount', 100), 100)
        config['rowCount'] = row_count
        
        # Check quota before proceeding if using tracked provider
        if self.is_initialized and self.current_provider:
            quota_check = await quota_manager.check_quota(self.current_provider, user_id, "dataset")
            if not quota_check["allowed"]:
                # If quota exceeded, try fallback to unlimited provider (Ollama)
                logger.warning(f"⚠️ Quota exceeded for {self.current_provider}: {quota_check['message']}")
                
                # Try Ollama as unlimited fallback
                if self.current_provider != "ollama":
                    try:
                        if hasattr(self, '_ollama_service') and self._ollama_service.is_initialized:
                            logger.info("🔄 Falling back to Ollama (unlimited) due to quota limits")
                            data = await self._ollama_service.generate_synthetic_data(schema, config, description, None)
                            if data and len(data) > 0:
                                logger.info(f"✅ Quota fallback successful: Generated {len(data)} records using Ollama")
                                return data
                    except Exception as e:
                        logger.warning(f"⚠️ Ollama fallback failed: {str(e)}")
                
                raise Exception(f"Quota limit exceeded: {quota_check['message']}")
                
        logger.info(f"🎯 Generating {row_count} rows using {self.current_provider}")
        
        # Try primary configured service first
        if self.is_initialized and self.current_provider:
            try:
                data = await self.generate_synthetic_data_advanced(schema, config, description)
                if data and len(data) > 0:
                    # Consume quota on successful generation
                    await quota_manager.consume_quota(self.current_provider, user_id, "dataset")
                    logger.info(f"✅ Successfully generated {len(data)} records using {self.current_provider}")
                    return data
                    
            except Exception as e:
                error_msg = str(e).lower()
                if "quota" in error_msg or "rate" in error_msg or "429" in error_msg:
                    logger.warning(f"⚠️ Quota exceeded for {self.current_provider}: {str(e)}")
                    
                    # Try Ollama as unlimited fallback
                    if self.current_provider != "ollama":
                        try:
                            if hasattr(self, '_ollama_service') and self._ollama_service.is_initialized:
                                logger.info("🔄 Falling back to Ollama due to quota exhaustion")
                                data = await self._ollama_service.generate_synthetic_data(schema, config, description, None)
                                if data and len(data) > 0:
                                    logger.info(f"✅ Quota exhaustion fallback successful: Generated {len(data)} records using Ollama")
                                    return data
                        except Exception as fallback_e:
                            logger.warning(f"⚠️ Ollama fallback failed: {str(fallback_e)}")
                    
                    raise Exception(f"Quota exceeded and fallback failed: {str(e)}")
                else:
                    logger.warning(f"⚠️ Primary service ({self.current_provider}) failed: {str(e)}")
                
        # Try intelligent fallback chain
        fallback_providers = []
        
        # Build fallback chain based on current provider
        if self.current_provider != "gemini" and self._gemini_fallback:
            fallback_providers.append(("gemini", self._gemini_fallback))
        
        if self.current_provider != "ollama" and hasattr(self, '_ollama_service'):
            fallback_providers.append(("ollama", self._ollama_service))
            
        for provider_name, service in fallback_providers:
            try:
                # Check quota for tracked providers
                if provider_name != "ollama":
                    quota_check = await quota_manager.check_quota(provider_name, user_id, "dataset")
                    if not quota_check["allowed"]:
                        logger.warning(f"⚠️ Skipping {provider_name} fallback due to quota limits")
                        continue
                
                logger.info(f"🔄 Falling back to {provider_name} service")
                
                if provider_name == "gemini":
                    data = await service.generate_synthetic_data(schema, config, description, None)
                elif provider_name == "ollama":
                    data = await service.generate_synthetic_data(schema, config, description, None)
                
                if data and len(data) > 0:
                    # Consume quota for tracked providers
                    if provider_name != "ollama":
                        await quota_manager.consume_quota(provider_name, user_id, "dataset")
                    logger.info(f"✅ Fallback successful: Generated {len(data)} records using {provider_name}")
                    return data
                    
            except Exception as e:
                logger.warning(f"⚠️ {provider_name} fallback failed: {str(e)}")
                continue
                
        raise Exception("All AI services failed to generate data. Please check your configuration and try again.")

# Global AI service instance
ai_service = AIService()
