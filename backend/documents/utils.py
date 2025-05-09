import os 
from docx import Document
from PyPDF2 import PdfReader

async def extract_text_from_file(file):
    file_path = f"temp/{file.filename}"
    os.makedirs("temp", exist_ok=True)

    # Save the file to a temporary location
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Extract text based on file type
    if file.content_type == "application/pdf":
        reader = PdfReader(file_path)
        text = " ".join([page.extract_text() for page in reader.pages])
    elif file.content_type == "text/plain":
        with open(file_path, "r") as f:
            text = f.read()
    elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        doc = Document(file_path)
        text = " ".join([para.text for para in doc.paragraphs])
    else:
        text = ""

    # Clean up the temporary file
    os.remove(file_path)

    return text