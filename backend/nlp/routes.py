from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from auth.security import get_current_user
from nlp.utils import get_vectorstore_for_file, generate_answer

router = APIRouter(prefix="/nlp", tags=["NLP"])

class QARequest(BaseModel):
    question: str
    file_id: int

@router.post("/ask")
async def ask_question(
    qa: QARequest,
    current_user: str = Depends(get_current_user)
):
    # Loading the vector store
    persist_dir = f"./vectorstore/{current_user.id}/{qa.file_id}"
    try:
        vectorstore = get_vectorstore_for_file(persist_directory=persist_dir)
    except Exception as e:
        raise HTTPException(status_code=404, detail="Vector store not found for this file.")
    
    result = vectorstore.similarity_search(qa.question, k=5)
    context = "\n".join([doc.page_content for doc in result])

    answer = generate_answer(qa.question, context)

    return {"answer": answer, "context": context}
    