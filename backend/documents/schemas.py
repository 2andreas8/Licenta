from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class DocumentBase(BaseModel):
    filename: str

class DocumentCreate(DocumentBase):
    content: str

class DocumentBrief(DocumentBase):
    id: int

    model_config = {
        "from_attributes": True
    }

class DocumentResponse(DocumentBase):
    id: int
    user_id: int

    model_config = {
        "from_attributes": True
    }

class DocumentStatus(DocumentBase):
    id: int
    processingComplete: bool
    status: str
    
    model_config = {
        "from_attributes": True
    }

class SummaryMetrics(BaseModel):
    chunk_count: int
    processing_time_seconds: float
    cached: bool
    generated_at: Optional[datetime] = None

class DocumentSummaryResponse(BaseModel):
    document_id: int
    document_title: str
    summary: str
    metrics: SummaryMetrics
    
    model_config = {
        "from_attributes": True
    }
    