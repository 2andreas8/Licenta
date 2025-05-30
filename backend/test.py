from dotenv import load_dotenv

load_dotenv()

from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

from nlp.utils import generate_answer, get_vectorstore_for_file
import os
import shutil

from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_core.documents import Document

# Găsește cele mai apropiate 5 chunk-uri pentru un query generic

def clear_vectorstore_folder():
    folder = "./vectorstore"
    if os.path.exists(folder):
        for filename in os.listdir(folder):
            file_path = os.path.join(folder, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        print("Conținutul folderului vectorstore a fost șters.")
    else:
        print("Folderul vectorstore nu există.")

def delete_test_vectorstore():
    folder = "./vectorstore/test"
    if os.path.exists(folder):
        shutil.rmtree(folder)
        print("Folderul ./vectorstore/test a fost șters.")
    else:
        print("Folderul ./vectorstore/test nu există.")

def test_vectorstore():
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    docs = [Document(page_content="Test document")]
    persist_dir = "./vectorstore/test"

    vector_store = Chroma.from_documents(
        documents=docs,
        embedding=embeddings,
        persist_directory=persist_dir
    )
    print("Persisted!")

    # Test load
    vector_store2 = Chroma(
        persist_directory=persist_dir,
        embedding_function=embeddings
    )
    print(vector_store2.similarity_search("Test"))

def test_nlp():
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    persist_dir = "./vectorstore/4/8"
    vectorstore = Chroma(
        persist_directory=persist_dir,
        embedding_function=embeddings
    )
    print(vectorstore.similarity_search("nota"))

if __name__ == "__main__":
    clear_vectorstore_folder()
