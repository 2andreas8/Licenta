from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings, OpenAI

from dotenv import load_dotenv

load_dotenv()

def get_vectorstore_for_file(persist_dir: str):
    embeddings = OpenAIEmbeddings(model="text-embedding-e-small")
    return Chroma(
        persist_directory=persist_dir,
        embedding_function=embeddings
    )

def generate_answer(question: str, context: str)-> str:
    # TODO - Implement the logic to generate an answer based on the question and context
    return "answer generation to be implemented"