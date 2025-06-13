import os 
from langchain_community.document_loaders import TextLoader, PyPDFLoader, Docx2txtLoader
from langchain.schema import Document
from langchain_text_splitters import CharacterTextSplitter, RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, OpenAI
from langchain_chroma import Chroma
import shutil

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
            # loader = TextLoader(file_path)
            loader = TextLoader(file_path, encoding="utf-8") # utf-8 encoding supports special characters
    elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        # doc = Document(file_path)
        # text = " ".join([para.text for para in doc.paragraphs])
        loader = Docx2txtLoader(file_path)
    else:
        os.remove(file_path)
        raise ValueError("Unsupported file type")
    
    documents = loader.load()
    cleaned_docs = []
    # Clean up null characters from the text
    for doc in documents:
        cleaned_text = doc.page_content.replace("\x00", "")
        cleaned_doc = Document(page_content=cleaned_text, metadata=doc.metadata)
        cleaned_docs.append(cleaned_doc)

    full_text =  "\n".join([doc.page_content for doc in cleaned_docs])

    # Clean up the temporary file
    os.remove(file_path)

    return full_text, cleaned_docs

def save_in_vectorstore(documents, file_id: int, user_id: int):
    # RercursiveCharacterTextSplitter has better performance than CharacterTextSplitter
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,  # overlap for better context
        separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""],
        length_function=len
        )
    docs = text_splitter.split_documents(documents=documents)

    for idx, doc in enumerate(docs):
        doc.metadata["file_id"] = file_id
        doc.metadata["user_id"] = user_id
        doc.metadata["chunk_id"] = idx
        doc.metadata["source"] = documents[0].metadata.get("source", "")
        doc.metadata["chunk_size"] = len(doc.page_content)

    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

    persist_dir = f"./vectorstore/{user_id}/{file_id}"
    os.makedirs(persist_dir, exist_ok=True)

    print("persist_dir =", persist_dir)
    print("persist_dir absolut =", os.path.abspath(persist_dir))

    try:
        vector_store = Chroma.from_documents(
            documents=docs,
            embedding=embeddings,
            persist_directory=persist_dir
        )
        print(f"Documents saved in vector store at {persist_dir}")
    except Exception as e:
        print(f"Error saving documents to vector store: {e}")

def delete_from_vectorstore(file_id: int, user_id: int):
    persist_dir = f"./vectorstore/{user_id}/{file_id}"
    if os.path.exists(persist_dir):
        shutil.rmtree(persist_dir)
        print(f"Deleted vector store at {persist_dir}")
        return True
    else: 
        print(f"Vector store at {persist_dir} does not exist.")
        return False