from pydantic import BaseModel

class QARequest(BaseModel):
    question: str
    file_id: int