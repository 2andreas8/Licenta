from pydantic import BaseModel
from typing import List

class QARequest(BaseModel):
    question: str
    file_id: int

class SourceInfo(BaseModel):
    chunk_id: int
    file_id: int
    content_preview: str

class QAResponse(BaseModel):
    answer: str
    sources: List[SourceInfo]
    total_chunks_used: int
