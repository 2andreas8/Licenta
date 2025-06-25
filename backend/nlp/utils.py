import os
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import HumanMessage, AIMessage
from langchain.memory import ConversationBufferWindowMemory
from rank_bm25 import BM25Okapi
import hashlib
from langdetect import detect
import langdetect.lang_detect_exception
import time

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
                page = doc.metadata.get('page', None)
            else:
                chunk_id = i
                file_id = 0
                page = None
                print(f"No metadata found for document {i}")

            # Add to context with fragment number
            if page is not None:
                context_parts.append(f"[Fragment {chunk_id}, Page {page}]: {doc.page_content}")
            else:
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

    lang = detect_language(question)
    
    # Alege promptul potrivit bazat pe limba detectată
    if lang == 'ro':
        template = """\
        Folosește **doar** următoarele fragmente de context și istoricul conversației pentru a răspunde la întrebare. **Nu** utiliza cunoștințe externe; dacă răspunsul nu se află în contextul furnizat, răspunde: "Îmi pare rău, nu pot răspunde la întrebarea ta, încearcă să o pui în alt mod."

        [Instrucțiuni de formatare]
        1. **Răspuns concis**: 1-2 propoziții care abordează direct întrebarea.
        2. **Explicație detaliată**: 3-5 puncte:
        - Rezumă conceptele cheie.
        - Include un exemplu scurt dacă clarifică răspunsul.
        3. **Citări**: Marchează fiecare fapt extras dintr-un fragment ca `[Fragmentul X, Pagina Y]` unde Y este numărul paginii.
        4. **Cod/Algoritmi**: Dacă prezinți cod sau algoritmi, formatează-le clar.
        5. **Legătură contextuală**: Fă referire la conversația anterioară când este relevant.

        **Fragmente de context:**
        {context}

        **Istoricul conversației:**
        {chat_history}

        **Întrebare:**
        {question}

        **Răspuns:**"""
    else:
        template = """\
        Use **only** the following context fragments and chat history to answer the question. Do **not** use any external knowledge; if the answer isn’t in the provided context, reply: “Sorry, can’t answer your question, try asking it in a different way.”

        [Formatting Instructions]
        1. **Concise Answer**: 1-2 sentences that directly address the question.  
        2. **Detailed Explanation**: 3-5 bullet points:  
        - Summarize key concepts.  
        - Include a brief example if it clarifies your point.  
        3. **Citations**: Mark each fact you draw from a fragment as `[Fragment X, Page Y]` where Y is the page number.  
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

def detect_language(text, sample_size=1000):
    """Detects the language of the provided text using a sample size."""
    try:
        sample = text[:sample_size] if len(text) > sample_size else text
        if not sample.strip():
            return 'en' # default to English if text is empty
        
        detected = detect(sample)
        if detected == 'ro':
            return detected
        else:
            return 'en'  # default to English for non-Romanian texts
    except langdetect.lang_detect_exception.LangDetectException as e:
        print(f"Error detecting language, defaulting to English: {e}")
        return 'en'

def generate_summary(text):
    """Generates a short summary of a section provided."""

    estimated_tokens = len(text) / 4
    if estimated_tokens > 15000:  # gpt-4o-mini's token limit
        text = text[:60000]  # preventive truncation

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0) 

    lang = detect_language(text)

    if lang == 'en':
        prompt = f"""
        Summarize the following text in a concise and informative manner.
        
        Guidelines:
        1. Identify and include the main topics, concepts, and key points
        2. Preserve important technical terms, names, and numerical data
        3. Structure your summary logically (if the text contains sections, reflect that)
        4. If the text includes code examples, mention what they demonstrate
        5. Length should be proportional to content importance (3-5 sentences for typical sections)
        
        TEXT TO SUMMARIZE:
        {text}   
        """
    elif lang == 'ro':
        prompt = f"""
        Rezumați următorul text într-un mod concis și informativ.

        Ghiduri:
        1. Identificați și includeți principalele subiecte, concepte și puncte cheie
        2. Păstrați termenii tehnici importanți, numele și datele numerice
        3. Structurați rezumatul logic (dacă textul conține secțiuni, reflectați asta)
        4. Dacă textul include exemple de cod, menționați ce demonstrează acestea
        5. Lungimea ar trebui să fie proporțională cu importanța conținutului (3-5 propoziții pentru secțiuni tipice)

        TEXT DE REZUMAT:
        {text}
        """

    try:
        return llm.invoke(prompt).content.strip()   
    except Exception as e:
        print(f"Error generating chunk summary: {e}")
        return "Summary generation failed due to an error."

def generate_final_summary(sections, document_title=None):
    """Combines multiple section summaries into a final summary."""
    
    print(f"Generating final summary for {len(sections)} sections")
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    combined_summaries = "\n\n".join([f"Section {i+1}: {summary}" for i, summary in enumerate(sections)])

    title_info = f"Document Title: {document_title}\n\n" if document_title else ""

    lang = detect_language(sections[0]) 

    if lang == 'en':
        prompt = f"""
        {title_info}Based on these section summaries, create a comprehensive document summary.
        
        Your summary should:
        1. Begin with a 1-2 sentence overview of the entire document
        2. Use clear headings to organize content by main topics
        3. Include bullet points for key concepts under each heading
        4. Highlight important terms, methods, or conclusions
        5. End with a brief statement of the document's significance or main takeaway
        6. Be under 500 words total
        
        Section Summaries:
        {combined_summaries}
        """
    elif lang == 'ro':
        prompt = f"""
        {title_info}Pe baza acestor rezumate de secțiuni, creați un rezumat cuprinzător al documentului.

        Rezumatul dvs. ar trebui să:
        1. Înceapă cu o prezentare generală de 1-2 propoziții a întregului document
        2. Utilizeze titluri clare pentru a organiza conținutul pe subiecte principale
        3. Include puncte cheie pentru conceptele importante sub fiecare titlu
        4. Evidențieze termeni, metode sau concluzii importante
        5. Se încheie cu o scurtă declarație despre semnificația sau concluzia principală a documentului
        6. Să fie sub 500 de cuvinte în total

        Rezumate de secțiuni:
        {combined_summaries}
        """

    try:
        return llm.invoke(prompt).content.strip()
    except Exception as e:
        print(f"Error generating final summary: {e}")
        return "Final summary generation failed due to an error."
    
def generate_summary_for_chunks(chunks, max_length=5000, document_title=None):
    """Generates summaries for each chunk of text. Groups chunks into sections and generates a final summary."""
    
    if len(chunks) <= 3:
        combined_text = "\n\n".join(chunks)
        return generate_summary(combined_text)
    
    unique_chunks = []
    content_hashes = set()
    
    for chunk in chunks:
        chunk_hash = hashlib.md5((chunk[:50] + chunk[-50:]).encode('utf-8')).hexdigest()  # hash based on first and last 50 characters
        if chunk_hash not in content_hashes:
            content_hashes.add(chunk_hash)
            unique_chunks.append(chunk)
    
    print(f"Reduced {len(chunks)} chunks to {len(unique_chunks)} unique chunks")
    
    groups = []
    current_group = []
    current_length = 0

    for chunk in unique_chunks:
        if current_length + len(chunk) > max_length:
            groups.append("\n\n".join(current_group))
            current_group = [chunk]
            current_length = len(chunk)
        else:
            current_group.append(chunk)
            current_length += len(chunk)
    
    if current_group:
        groups.append("\n\n".join(current_group))

    print(f"Created {len(groups)} groups of chunks")
    group_summaries = []
    for i, group in enumerate(groups):
        print(f"Group {i+1} length: {len(group)} characters")
        group_summary = generate_summary(group)
        print(f" ✓ Group {i+1} summary done.")
        group_summaries.append(group_summary)

    final_summary = generate_final_summary(group_summaries, document_title=document_title)
    print("Final summary generated successfully.")

    return final_summary