from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class MessageBase(BaseModel):
    role: str
    content: str

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: int
    conversation_id: int
    timestamp: datetime

    model_config = {
        "from_attributes": True
    }

class ConversationBase(BaseModel):
    document_id: int
    title: Optional[str] = None

class ConversationCreate(ConversationBase):
    pass

class ConversationResponse(ConversationBase):
    id: int
    user_id: int
    created_at: datetime
    messages: List[MessageResponse] = []

    model_config = {
        "from_attributes": True
    }

class ConversationUpdate(BaseModel):
    title: Optional[str] = None