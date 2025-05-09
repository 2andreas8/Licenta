from fastapi import APIRouter, UploadFile, File, HTTPException
from documents.utils import extract_text_from_file

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if file.content_type not in [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    ]:
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    # Aceasta parte trebuie să fie în afara blocului `if`
    text = await extract_text_from_file(file)
    # print(f"Extracted text: {text}")

    return { "filename": file.filename, "text": text }
