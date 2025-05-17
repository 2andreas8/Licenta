from dotenv import load_dotenv

load_dotenv()

from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

from nlp.utils import generate_answer

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma(persist_directory="./vectorstore/3/3", embedding_function=embeddings)

# Găsește cele mai apropiate 5 chunk-uri pentru un query generic


if __name__ == "__main__":
    context = "The capital of France is Paris. The capital of Germany is Berlin. The capital of Italy is Rome."
    question = "What is the capital of France?"
    answer = generate_answer(question, context)
    print("Answer: ", answer)
