from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from nlp.schemas import QARequest
from auth.security import get_current_user
from nlp.utils import get_vectorstore_for_file, hybrid_search, get_relevant_documents
from nlp.utils import generate_answer_with_sources, generate_summary_for_chunks
from langchain.memory import ConversationBufferWindowMemory
from conversations.models import Conversation, Message
from documents.models import Document
from conversations.schemas import MessageCreate
from database.db import SessionLocal
from sqlalchemy.orm import Session
import time
import os

router = APIRouter(prefix="/nlp", tags=["NLP"])

# dict for storing conversation memories
conversation_memories = {}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/ask")
async def ask_question(
    qa: QARequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print("current_user.id =", current_user.id)
    print("file_id =", qa.file_id)

    if hasattr(qa, 'conversation_id') and qa.conversation_id:
        # check if conv exists and owned by current user
        conversation = db.query(Conversation).filter(
            Conversation.id == qa.conversation_id,
            Conversation.user_id == current_user.id
        ).first()

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found or not owned by user.")
        
        if qa.conversation_id not in conversation_memories:
            memory = ConversationBufferWindowMemory(
                memory_key="chat_history",
                k=5,  # number of messages to keep in memory
                return_messages=True
            )

            previous_messages = db.query(Message).filter(
                Message.conversation_id == qa.conversation_id
            ).order_by(Message.timestamp).all()

            for msg in previous_messages:
                if msg.role == "user":
                    memory.chat_memory.add_user_message(msg.content)
                elif msg.role == "assistant":
                    memory.chat_memory.add_ai_message(msg.content)

            conversation_memories[qa.conversation_id] = memory

        memory = conversation_memories.get(qa.conversation_id)
        print("Using existing memory for conversation:", qa.conversation_id)
    else:
        memory = None
        print("No conversation memory found, using default memory.")
    
    persist_dir = os.path.abspath(f"./vectorstore/{current_user.id}/{qa.file_id}")
    print("persist_dir =", persist_dir)

    try:
        vectorstore = get_vectorstore_for_file(persist_dir)
        print("Vectorstore loaded OK")
    except Exception as e:
        print("Error loading vectorstore:", e)
        raise HTTPException(status_code=404, detail="Vector store not found for this file.")
    
    try:
        relevant_docs = hybrid_search(vectorstore, qa.question, k=4)
        print(f"Found {len(relevant_docs)} relevant documents")
    except Exception as e:
        print("Error finding relevant documents:", e)
        raise HTTPException(status_code=500, detail=f"Error finding relevant documents: {str(e)}")

    if not relevant_docs:
        raise HTTPException(status_code=404, detail="No relevant documents found.")
    
    try:
        result = generate_answer_with_sources(qa.question, relevant_docs, memory)
        print("Answer generated successfully")
        return result
    except Exception as e:
        print("Error generating answer:", e)
        raise HTTPException(status_code=500, detail="Error generating answer.")

@router.post("/summary/{file_id}")
async def generate_document_summary(
    file_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates a summary for the document associated with the given file_id."""
    '''document = db.query(Document).filter(
        Document.id == file_id,
        Document.user_id == current_user.id
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found or not owned by user.")
    
    persist_dir = os.path.abspath(f"./vectorstore/{current_user.id}/{file_id}")
    try:
        vectorstore = get_vectorstore_for_file(persist_dir)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Vector store not found for this file.")
    
    all_docs = vectorstore.get()
    chunks = all_docs["documents"]

    chunk_count = len(chunks)
    total_chars = sum(len(chunk) for chunk in chunks)
    print(f"Total chunks: {chunk_count}, Total characters: {total_chars}")

    start_time = time.time()

    try:
        summary = generate_summary_for_chunks(
            chunks,
            max_length=5000,
            document_title=document.filename
        )

        processing_time = time.time() - start_time

        result = {
            "document_id": file_id,
            "document_title": document.filename,
            "summary": summary,
            "metrics": {
                "chunk_count": chunk_count,
                "total_characters": total_chars,
                "processing_time_seconds": round(processing_time, 2)
            }
        }

        # TODO save to db

        return result

    except Exception as e:
        print(f"Error generating summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")'''
    
    return {
        "document_id": file_id,
        "document_title": "Example Document",
        "summary": "This is a placeholder summary for the document.",
    }

# TEST
@router.get("/debug/search-comparison/{file_id}")
async def compare_search_methods(
    file_id: int,
    query: str,
    current_user = Depends(get_current_user)
):
    persist_dir = f"./vectorstore/{current_user.id}/{file_id}"
    vectorstore = get_vectorstore_for_file(persist_dir)
    
    # Results from both methods
    semantic_results = get_relevant_documents(vectorstore, query, k=3)
    hybrid_results = hybrid_search(vectorstore, query, k=3)
    
    # Format results for easier comparison
    return {
        "query": query,
        "semantic_results": [
            {
                "content": doc.page_content[:200] + "...",
                "metadata": doc.metadata
            } for doc in semantic_results
        ],
        "hybrid_results": [
            {
                "content": doc.page_content[:200] + "...",
                "metadata": doc.metadata
            } for doc in hybrid_results
        ]
    }