import os 
from langchain_community.document_loaders import TextLoader, PyPDFLoader, Docx2txtLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, OpenAI
from langchain_chroma import Chroma

from dotenv import load_dotenv

load_dotenv()

async def extract_text_from_file(file):
    file_path = f"temp/{file.filename}"
    os.makedirs("temp", exist_ok=True)

    # Save the file to a temporary location
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Extract text based on file type
    if file.content_type == "application/pdf":
        # reader = PdfReader(file_path)
        # text = " ".join([page.extract_text() for page in reader.pages])
        loader = PyPDFLoader(file_path)
    elif file.content_type == "text/plain":
        with open(file_path, "r") as f:
            # text = f.read()
            loader = TextLoader(file_path)
    elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        # doc = Document(file_path)
        # text = " ".join([para.text for para in doc.paragraphs])
        loader = Docx2txtLoader(file_path)
    else:
        os.remove(file_path)
        raise ValueError("Unsupported file type")
    
    documents = loader.load()
    full_text =  "/n".join([doc.page_content for doc in documents])

    # Clean up the temporary file
    os.remove(file_path)

    return full_text, documents

def save_in_vectorstore(documents, file_id: int, user_id: int):
    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=100, separator="\n")
    docs = text_splitter.split_documents(documents=documents)

    for idx, doc in enumerate(docs):
        doc.metadata["file_id"] = file_id
        doc.metadata["user_id"] = user_id
        doc.metadata["chunk_id"] = idx

    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

    persist_dir = f"./vectorstore/{user_id}/{file_id}"
    os.makedirs(persist_dir, exist_ok=True)

    try:
        vector_store = Chroma.from_documents(
            documents=docs,
            embedding=embeddings,
            persist_directory=persist_dir
        )
        print(f"Documents saved in vector store at {persist_dir}")
    except Exception as e:
        print(f"Error saving documents to vector store: {e}")
