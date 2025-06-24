from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database.db import SessionLocal
from auth.security import get_current_user
from analytics.schemas import UserStatistics, LatestConversation, RecommendedDocument
from analytics.crud import (
    get_documents_count,
    get_conversations_count,
    get_questions_count,
    get_avg_response_time,
    get_document_usage,
)
from analytics.utils import calculate_most_active_day
from datetime import datetime, timedelta
from conversations.models import Conversation, Message
from documents.models import Document
from typing import List, Optional


router = APIRouter(prefix="/analytics", tags=["Analytics"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/user-stats", response_model=UserStatistics)
async def get_user_statistics(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        documents_count = get_documents_count(db, current_user.id)
        conversations_count = get_conversations_count(db, current_user.id)
        questions_count = get_questions_count(db, current_user.id)
        avg_response_time = get_avg_response_time(db, current_user.id)
        document_usage = get_document_usage(db, current_user.id)

        # Calculate most active day
        most_active_day = calculate_most_active_day(db, current_user.id)

        return UserStatistics(
            documents_count=documents_count,
            conversations_count=conversations_count,
            questions_count=questions_count,
            avg_response_time_ms=avg_response_time,
            document_usage=document_usage,
            most_active_day=most_active_day
        )
    except Exception as e:
        print(f"Error generating user statistics: {e}")
        raise HTTPException(
                status_code=500,
                detail=f"Failed to generate user statistics: {str(e)}"
            )
           
# Adaugă aceste endpoint-uri după endpoint-ul existent '/user-stats'

@router.get("/latest-conversation", response_model=Optional[LatestConversation])
async def get_latest_conversation(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns the user's most recent conversation with details."""
    try:
        # Obține cea mai recentă conversație a utilizatorului
        latest_conversation = db.query(Conversation).filter(
            Conversation.user_id == current_user.id
        ).order_by(
            Conversation.created_at.desc()
        ).first()
        
        if not latest_conversation:
            return None
        
        # Obține documentul asociat
        document = db.query(Document).filter(
            Document.id == latest_conversation.document_id
        ).first()
        
        # Obține ultimul mesaj
        last_message = db.query(Message).filter(
            Message.conversation_id == latest_conversation.id
        ).order_by(
            Message.timestamp.desc()
        ).limit(2).all()
        
        return {
            "id": latest_conversation.id,
            "document": document.filename if document else "Untitled Document",
            "lastQuestion": last_message[1].content if last_message and last_message[1].role == "user" else "",
            "timeAgo": latest_conversation.created_at.isoformat()
        }
    except Exception as e:
        print(f"Error fetching latest conversation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch latest conversation: {str(e)}"
        )

@router.get("/recommended-documents", response_model=List[RecommendedDocument])
async def get_recommended_documents(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns document recommendations based on user activity."""
    try:
        # Recent documents
        recent_docs = db.query(Document).filter(
            Document.user_id == current_user.id
        ).order_by(
            Document.id.desc()  # Recent first
        ).limit(3).all()
        
        if not recent_docs:
            return []

        # For simplicity, recommend other documents that the user hasn't accessed recently
        other_docs = db.query(Document).filter(
            Document.user_id == current_user.id,
            Document.id.notin_([doc.id for doc in recent_docs])
        ).limit(1).all()
        
        recommendations = []
        for doc in other_docs:
            recommendations.append({
                "id": doc.id,
                "filename": doc.filename,
                "reason": "Similar to your recent documents"
            })
        
        return recommendations
    except Exception as e:
        print(f"Error generating document recommendations: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate document recommendations: {str(e)}"
        )