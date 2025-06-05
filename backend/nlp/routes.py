from fastapi import APIRouter, Depends, HTTPException
from nlp.schemas import QARequest
from auth.security import get_current_user
from nlp.utils import get_vectorstore_for_file, generate_answer, get_relevant_documents, generate_answer_with_sources

import os

router = APIRouter(prefix="/nlp", tags=["NLP"])

@router.post("/ask")
async def ask_question(
    qa: QARequest,
    current_user = Depends(get_current_user)
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
    
    try:
        relevant_docs = get_relevant_documents(vectorstore, qa.question, k=4)
        print(f"Found {len(relevant_docs)} relevant documents")
    except Exception as e:
        print("Error finding relevant documents:", e)
        raise HTTPException(status_code=500, detail=f"Error finding relevant documents: {str(e)}")

    if not relevant_docs:
        raise HTTPException(status_code=404, detail="No relevant documents found.")
    
    try:
        result = generate_answer_with_sources(qa.question, relevant_docs)
        print("Answer generated successfully")
        return result
    except Exception as e:
        print("Error generating answer:", e)
        raise HTTPException(status_code=500, detail="Error generating answer.")



    # try:
    #     vectorstore = get_vectorstore_for_file(persist_dir)
    #     print("Vectorstore loaded OK")
    # except Exception as e:
    #     print("Error loading vectorstore:", e)
    #     raise HTTPException(status_code=404, detail="Vector store not found for this file.")
    
    # result = vectorstore.similarity_search(qa.question, k=2)
    # if not result:
    #     raise HTTPException(status_code=404, detail="No relevant documents found.")
    # context = "\n".join([doc.page_content for doc in result])

    # try:
    #     answer = generate_answer(qa.question, context)
    #     return {"answer": answer}
    # except Exception as e:
    #     raise HTTPException(status_code=500, detail=f"Error generating answer: {str(e)}")

    # return {"answer": f"Test response for question: {qa.question} on file ID: {qa.file_id}"}    
    
# ...existing code...

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