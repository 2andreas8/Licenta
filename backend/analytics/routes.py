from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import SessionLocal
from auth.security import get_current_user
from analytics.schemas import UserStatistics
from analytics.crud import (
    get_documents_count,
    get_conversations_count,
    get_questions_count,
    get_avg_response_time,
    get_document_usage,
)
from analytics.utils import calculate_most_active_day

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
           
            
