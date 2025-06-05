from fastapi import APIRouter, Depends, HTTPException
from nlp.schemas import QARequest
from auth.security import get_current_user
from nlp.utils import get_vectorstore_for_file, generate_answer

import os

router = APIRouter(prefix="/nlp", tags=["NLP"])

@router.post("/ask")
async def ask_question(
    qa: QARequest,
    current_user: str = Depends(get_current_user)
):
    print("current_user.id =", current_user.id)
    print("file_id =", qa.file_id)
    
    persist_dir = os.path.abspath(f"./vectorstore/{current_user.id}/{qa.file_id}")
    print("persist_dir =", persist_dir)

    try:
        vectorstore = get_vectorstore_for_file(persist_dir)
        print("Vectorstore loaded OK")
    except Exception as e:
        print("Error loading vectorstore:", e)
        raise HTTPException(status_code=404, detail="Vector store not found for this file.")
    
    result = vectorstore.similarity_search(qa.question, k=2)
    if not result:
        raise HTTPException(status_code=404, detail="No relevant documents found.")
    context = "\n".join([doc.page_content for doc in result])

    try:
        answer = generate_answer(qa.question, context)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating answer: {str(e)}")

    # return {"answer": f"Test response for question: {qa.question} on file ID: {qa.file_id}"}    
    