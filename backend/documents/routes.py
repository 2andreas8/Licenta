from fastapi import APIRouter, UploadFile, File, HTTPException, UploadFile, Depends
from sqlalchemy.orm import Session
from typing import List
from documents import schemas
from documents.utils import extract_text_from_file, save_in_vectorstore, delete_from_vectorstore
from documents.models import Document
from conversations.models import Conversation
from database.db import SessionLocal
from auth.security import get_current_user

import os

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


@router.delete("/{document_id}", response_model=schemas.DocumentResponse)
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == current_user.id
        ).first()

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        try: 
            delete_from_vectorstore(document_id, current_user.id)
        except Exception as e:
            print(f"Error deleting from vector store: {e}")
            # continue with document deletion from database
    
        conversations = db.query(Conversation).filter(
            Conversation.document_id == document_id,
            Conversation.user_id == current_user.id
        ).all()

        for conv in conversations:
            db.delete(conv)

        db.delete(document)
        db.commit()

        return document
    except HTTPException as http_e:
        raise http_e
    except Exception as e:
        db.rollback()
        print(f"Unexpected error deleting document: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Unexpected error deleting document: {str(e)}"
        )
    
@router.get("/{document_id}/status", response_model=schemas.DocumentStatus)
async def check_document_status(
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
    
    vector_path = f"./vectorstore/{current_user.id}/{document_id}"
    exists = os.path.exists(vector_path)

    return {
        "id": document.id,
        "filename": document.filename,
        "processingComplete": exists,
        "status": "complete" if exists else "processing"
    }



