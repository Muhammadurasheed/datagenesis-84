from pydantic import BaseModel
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime

class GenerationRequest(BaseModel):
    project_id: Optional[str] = None
    domain: str
    data_type: str  # tabular, timeseries, text, image
    source_data: List[Dict[str, Any]] = []
    dataset_schema: Dict[str, Any] = {}
    description: Optional[str] = None
    config: Dict[str, Any] = {}
    
    class Config:
        json_schema_extra = {
            "example": {
                "domain": "healthcare",
                "data_type": "tabular",
                "description": "Generate patient data with demographics and medical history",
                "source_data": [
                    {"patient_id": "P001", "age": 45, "diagnosis": "diabetes"},
                    {"patient_id": "P002", "age": 32, "diagnosis": "hypertension"}
                ],
                "dataset_schema": {
                    "patient_id": {"type": "string", "description": "Patient identifier"},
                    "age": {"type": "number", "description": "Patient age"},
                    "diagnosis": {"type": "string", "description": "Medical diagnosis"}
                },
                "config": {
                    "row_count": 1000,
                    "privacy_level": "maximum",
                    "quality_level": "high"
                }
            }
        }

class GenerationResponse(BaseModel):
    job_id: str
    status: str
    message: str
    estimated_completion: Optional[datetime] = None
    
class GenerationStatus(BaseModel):
    job_id: str
    status: str  # pending, running, completed, failed, cancelled
    progress: int  # 0-100
    message: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

class DataAnalysisRequest(BaseModel):
    sample_data: List[Dict[str, Any]]
    config: Dict[str, Any] = {}
    
class DataAnalysisResponse(BaseModel):
    analysis: Dict[str, Any]
    recommendations: Dict[str, Any]
    estimated_time: str
    quality_score: float

class NaturalLanguageRequest(BaseModel):
    description: str
    domain: str = 'general'
    data_type: str = 'tabular'
    
class SchemaGenerationResponse(BaseModel):
    dataset_schema: Dict[str, Any]
    detected_domain: str
    sample_data: List[Dict[str, Any]] = []
    suggestions: List[str] = []