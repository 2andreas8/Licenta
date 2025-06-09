from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from conversations.models import Conversation, Message

def calculate_most_active_day(db: Session, user_id: int, days=7) -> str:
    start_date = datetime.now() - timedelta(days=days)

    daily_activity = db.query(
        func.date(Message.timestamp).label("day"),
        func.count(Message.id).label("message_count")
    ).join(
        Conversation
    ).filter(
        Conversation.user_id == user_id,
        Message.timestamp >= start_date
    ).group_by(
        func.date(Message.timestamp)
    ).order_by(
        func.count(Message.id).desc()
    ).first()

    if daily_activity:
        return daily_activity.day.strftime("%Y-%m-%d")
    return None
