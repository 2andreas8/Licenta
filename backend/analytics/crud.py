from sqlalchemy.orm import Session
from sqlalchemy import func
from documents.models import Document
from conversations.models import Conversation, Message

def get_documents_count(db: Session, user_id: int) -> int:
    return db.query(func.count(Document.id)).filter(
        Document.user_id == user_id
    ).scalar() or 0

def get_conversations_count(db: Session, user_id: int) -> int:
    return db.query(func.count(Conversation.id)).filter(
        Conversation.user_id == user_id
    ).scalar() or 0

def get_questions_count(db: Session, user_id: int) -> int:
    return db.query(func.count(Message.id)).join(
        Conversation
    ).filter(
        Conversation.user_id == user_id,
        Message.role == "user"
    ).scalar() or 0

def get_avg_response_time(db: Session, user_id: int) -> float:
    conversations = db.query(Conversation).filter(
        Conversation.user_id == user_id
    ).all()

    if not conversations:
        return 0.0
    
    total_response_time = 0
    response_count = 0

    for conversation in conversations:
        messages = db.query(Message).filter(
            Message.conversation_id == conversation.id
        ).order_by(Message.timestamp).all()

        for i in range(len(messages) - 1):
            if messages[i].role == "user" and messages[i + 1].role == "assistant":
                time_diff = (messages[i + 1].timestamp - messages[i].timestamp).total_seconds() * 1000
                total_response_time += time_diff
                response_count += 1

    if response_count == 0:
        return 0.0
    
    return total_response_time / response_count

def get_document_usage(db: Session, user_id: int) -> list:
    # returns stats about document usage
    document_stats = db.query(
        Document.id,
        Document.filename,
        func.count(Message.id).label("interactions")
    ).join(
        Conversation, Document.id == Conversation.document_id
    ).join(
        Message, Conversation.id == Message.conversation_id
    ).filter(
        Document.user_id == user_id
    ).group_by(
        Document.id
    ).order_by(
        func.count(Message.id).desc()
    ).limit(5).all()

    return [
        {"id": doc.id, "filename": doc.filename, "interactions": doc.interactions}
        for doc in document_stats
    ]
