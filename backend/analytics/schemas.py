from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserStatistics(BaseModel):
    documents_count: int
    conversations_count: int
    questions_count: int
    avg_response_time_ms: Optional[float] = None
    most_active_day: Optional[datetime] = None
    document_usage: List[dict] = []