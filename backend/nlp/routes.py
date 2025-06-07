from fastapi import APIRouter, Depends, HTTPException
from nlp.schemas import QARequest
from auth.security import get_current_user
from nlp.utils import get_vectorstore_for_file, generate_answer, get_relevant_documents, generate_answer_with_sources
from langchain.memory import ConversationBufferWindowMemory
from conversations.models import Conversation, Message
from conversations.schemas import MessageCreate
from database.db import SessionLocal
from sqlalchemy.orm import Session
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
        relevant_docs = get_relevant_documents(vectorstore, qa.question, k=4)
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



@router.get("/debug/chunks/{file_id}")
async def debug_file_chunks(
    file_id: int,
    current_user = Depends(get_current_user)
):
    """Debug endpoint pentru a vedea chunk-urile unui fișier"""
    persist_dir = os.path.abspath(f"./vectorstore/{current_user.id}/{file_id}")
    
    try:
        vectorstore = get_vectorstore_for_file(persist_dir)
        
        # Ia primele 3 documente pentru debug
        docs = vectorstore.similarity_search("", k=3)
        
        chunks_info = []
        for i, doc in enumerate(docs):
            print(f"Document {i} metadata: {doc.metadata}")
            chunks_info.append({
                "index": i,
                "metadata": doc.metadata,
                "content_preview": doc.page_content[:200] + "...",
                "content_length": len(doc.page_content)
            })
        
        return {
            "file_id": file_id,
            "chunks_shown": len(chunks_info),
            "chunks": chunks_info
        }
    
    except Exception as e:
        print(f"Debug error: {e}")
        return {"error": str(e), "file_id": file_id}