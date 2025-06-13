import os
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import HumanMessage, AIMessage
from langchain.memory import ConversationBufferWindowMemory
from rank_bm25 import BM25Okapi

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

def get_relevant_documents(vectorstore, question: str, k: int = 4):
    """Retrieves relevant documents from the vectorstore based on the question."""
    docs = vectorstore.similarity_search_with_relevance_scores(question, k=k)

    # Filter docs based on relevance score
    relevant_docs = [doc for doc, score in docs if score > 0.7]

    if(len(relevant_docs) < 2):
        relevant_docs = [doc for doc, score in docs]

    # Sort by id for a logical order

    relevant_docs.sort(key=lambda x: x.metadata.get('chunk_id', 0))

    return relevant_docs

def hybrid_search(vectorstore, question: str, k: int = 4):
    # similarity search
    semantic_results = vectorstore.similarity_search_with_relevance_scores(question, k=k)

    all_docs = vectorstore.get()
    chunks = all_docs["documents"] # vs.get returns a dict with "documents" key
    tokenized_content = [doc.split() for doc in chunks]

    # BM25 search
    bm25 = BM25Okapi(tokenized_content)
    tokenized_query = question.split()
    lexical_scores = bm25.get_scores(tokenized_query)

    # combine results
    combined_results = []
    for doc, sem_score in semantic_results:
        doc_id = doc.metadata.get("id", None)
        found_idx = None
        
        # find the index of the document in chunks
        for i, content in enumerate(chunks):
            if content == doc.page_content:
                found_idx = i
                break
        
        # combine semantic and lexical scores
        if found_idx is not None:
            lex_score = lexical_scores[found_idx]
            # normalize lexical score (0 to 1)
            norm_lex_score = lex_score / max(lexical_scores) if max(lexical_scores) > 0 else 0

            # combine scores (70% semantic, 30% lexical)
            combined_score = 0.7 * sem_score + 0.3 * norm_lex_score
            combined_results.append((doc, combined_score))
        else:
            # if document not found in chunks, use only semantic score
            combined_results.append((doc, sem_score * 0.7))

    combined_results.sort(key=lambda x: x[1], reverse=True)

    return [doc for doc, _ in combined_results[:k]]


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

def generate_answer_with_sources(question: str, docs: list, memory=None) -> dict:
    """Generates an answer with sources from the context."""
    print(f"Starting generate_answer_with_sources with {len(docs)} documents")

    print(f"Memory received: {memory is not None}")
    if memory:
        print(f"Memory messages count: {len(memory.chat_memory.messages)}")
    
    # Print info despre fiecare document pentru debugging
    for i, doc in enumerate(docs):
        print(f"Document {i}:")
        print(f"  Type: {type(doc)}")
        print(f"  Metadata: {doc.metadata if hasattr(doc, 'metadata') else 'No metadata'}")

    context_parts = []
    sources_info = []
    
    for i, doc in enumerate(docs):
        try:
            # Check if doc has metadata 
            if hasattr(doc, 'metadata') and doc.metadata is not None:
                chunk_id = doc.metadata.get('chunk_id', i)
                file_id = doc.metadata.get('file_id', 0)
            else:
                chunk_id = i
                file_id = 0
                print(f"No metadata found for document {i}")

            # Add to context with fragment number
            context_parts.append(f"[Fragment {chunk_id}]: {doc.page_content}")
            
            # Add info about the source
            sources_info.append({
                "chunk_id": int(chunk_id), # ensure chunk_id is an int as expected in schema
                "file_id": int(file_id),    
                "content_preview": doc.page_content[:100] + "..."
            })
            
            print(f"Processed document {i} successfully")
            
        except Exception as e:
            print(f"Error processing document {i}: {e}")
            # Use default values for errors
            context_parts.append(f"[Fragment {i}]: {doc.page_content}")
            sources_info.append({
                "chunk_id": i,
                "file_id": 0,
                "content_preview": doc.page_content[:100] + "..."
            })
    
    context = "\n\n".join(context_parts)
    print(f"Created context with {len(context_parts)} parts")
    
    # template = """Use the following pieces of context to answer the question at the end.
    # If you don't know the answer, use information from the previous conversation if relevant. If not just say "I cannot answer based on the provided documents".
    # Mention the sources of your answer in the format [Fragment X].
    
    
    # Fragments:
    # {context}

    # Previous conversation:
    # {chat_history}
    
    # Question: {question}
    
    # Answer:"""

    template = """\
    Use **only** the following context fragments and chat history to answer the question. Do **not** use any external knowledge; if the answer isn’t in the provided context, reply: “Sorry, can’t answer your question, try asking it in a different way.”

    [Formatting Instructions]
    1. **Concise Answer**: 1-2 sentences that directly address the question.  
    2. **Detailed Explanation**: 3-5 bullet points:  
    - Summarize key concepts.  
    - Include a brief example if it clarifies your point.  
    3. **Citations**: Mark each fact you draw from a fragment as `[Fragment X]`.  
    4. **Code/Algorithms**: If showing code or algorithms, format them clearly.  
    5. **Contextual Linking**: Refer to prior conversation when relevant.

    **Context Fragments:**  
    {context}

    **Chat History:**  
    {chat_history}

    **Question:**  
    {question}

    **Answer:**"""


    
    try:
        chat_history = ""
        if memory:
            messages = memory.chat_memory.messages
            if messages:
                chat_history_parts = []
                for msg in reversed(messages):
                    if isinstance(msg, HumanMessage):
                        chat_history_parts.append(f"Human: {msg.content}")
                    elif isinstance(msg, AIMessage):
                        chat_history_parts.append(f"AI: {msg.content}")
                        
                chat_history = "Previous conversation:\n" + "\n".join(chat_history_parts)
            else:
                chat_history = ""
        else:
            chat_history = ""

        prompt_template = PromptTemplate(
            template=template,
            input_variables=["context", "question", "chat_history"]
        )
        
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
        final_prompt = prompt_template.format(
            context=context, 
            question=question,
            chat_history=chat_history    
        )
        
        print("Sending request to OpenAI...")
        response = llm.invoke([HumanMessage(content=final_prompt)])
        print("Received response from OpenAI")
        
        if memory:
            memory.chat_memory.add_user_message(question)
            memory.chat_memory.add_ai_message(response.content.strip())

        result = {
            "answer": response.content.strip(),
            "sources": sources_info,
            "total_chunks_used": len(docs)
        }
        
        print("Result generated successfully")
        return result
        
    except Exception as e:
        print(f"Error in LLM call: {e}")
        raise