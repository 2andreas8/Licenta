from pydantic import BaseModel

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
    