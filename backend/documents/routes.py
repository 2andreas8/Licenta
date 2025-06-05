from fastapi import APIRouter, UploadFile, File, HTTPException, UploadFile, Depends
from sqlalchemy.orm import Session
from typing import List
from documents import schemas
from documents.utils import extract_text_from_file, save_in_vectorstore
from documents.models import Document
from database.db import SessionLocal
from auth.security import get_current_user

router = APIRouter(prefix="/documents", tags=["Documents"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/upload", response_model=schemas.DocumentResponse)
async def upload_document(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    current_user=Depends(get_current_user)
):
    if file.content_type not in [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    ]:
        raise HTTPException(status_code=400, detail="Unsupported file type.")
    try:
        text, docs = await extract_text_from_file(file)

        new_document = Document(
            filename=file.filename,
            content=text,
            user_id=current_user.id
        )

        db.add(new_document)
        db.commit()
        db.refresh(new_document)

        save_in_vectorstore(docs, file_id=new_document.id, user_id=current_user.id)

        return { 
            "id": new_document.id, 
            "user_id": new_document.user_id,
            "filename": new_document.filename
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing file: {str(e)}"
        )
    

@router.get("/my_files", response_model=List[schemas.DocumentBrief])
def get_my_files(
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    files = db.query(Document).filter(Document.user_id == current_user.id).all()
    return [{
        "id": file.id,
        "filename": file.filename
    } for file in files]

@router.get("/{file_id}", response_model=schemas.DocumentResponse)
async def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document
