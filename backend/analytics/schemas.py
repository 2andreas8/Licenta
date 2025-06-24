from pydantic import BaseModel
from typing import List, Optional, Union
from datetime import datetime

class UserStatistics(BaseModel):
    documents_count: int
    conversations_count: int
    questions_count: int
    avg_response_time_ms: Optional[float] = None
    most_active_day: Optional[datetime] = None
    document_usage: List[dict] = []

class LatestConversation(BaseModel):
    id: int
    document: str
    lastQuestion: str
    timeAgo: str
    
    model_config = {
        "from_attributes": True
    }

class RecommendedDocument(BaseModel):
    id: int
    filename: str
    reason: str
    
    model_config = {
        "from_attributes": True
    }