import os
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import HumanMessage

from dotenv import load_dotenv

load_dotenv()

def get_vectorstore_for_file(persist_dir: str):
    if not os.path.exists(persist_dir):
        raise FileNotFoundError(f"Vectorstore directory does not exist: {persist_dir}")
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    try:
        vectorstore = Chroma(
            persist_directory=persist_dir,
            embedding_function=embeddings
        )
        return vectorstore
    except Exception as e:
        print("Error loading vectorstore:", e)
        raise


def generate_answer(question: str, context: str)-> str:
    # TODO - Implement the logic to generate an answer based on the question and context

    template = """Use the following pieces of context to answer the question at the end. 
    If you don't know the answer, just say “Sorry, can’t answer your question, try to ask it in a different way”, don't try to make up an answer. 
    Use the only the following pieces of context, don't use your own knowledge. 
    
    Context: {context}
    Question: {question}"""

    prompt_template = PromptTemplate(
        template=template,
        input_variables=["context", "question"]
    )
    llm = ChatOpenAI(model="gpt-4o-mini", verbose=True, temperature=0)

    final_prompt = prompt_template.format(context=context, question=question)

    response = llm.invoke([HumanMessage(content=final_prompt)])

    return response.content.strip()

    # return f"Simulated answer for question: '{question}' based on context: '{context}'"