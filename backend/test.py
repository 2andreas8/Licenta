from dotenv import load_dotenv

load_dotenv()

from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma(persist_directory="./vectorstore/3/3", embedding_function=embeddings)

# Găsește cele mai apropiate 5 chunk-uri pentru un query generic


if __name__ == "__main__":
    results = vectorstore.similarity_search("Determinarea de superpixeli", k=2)

    for i, doc in enumerate(results):
        print(f"Chunk {i}:")
        print("Content:", doc.page_content)
        print("Metadata:", doc.metadata)
        print("-" * 40)
