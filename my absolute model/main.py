# app.py
import io
import logging
import sys
from typing import List

import requests
import torch
from flask import Flask, request, jsonify
from langchain.chains import create_retrieval_chain

from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.llms import HuggingFacePipeline
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from langchain_core.prompts import PromptTemplate
from PIL import Image
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline, BitsAndBytesConfig
import fitz  # PyMuPDF
import pytesseract

# --- Basic Configuration ---
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# --- Flask App Initialization ---
app = Flask(__name__)

# --- Model & Embedding Definitions ---
MODEL_ID = "ibm-granite/granite-3b-code-instruct"
EMBEDDING_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"
OCR_THRESHOLD = 100

# --- Caching Mechanism ---
PIPELINE_CACHE = {}

def extract_text_from_pdf_bytes(pdf_bytes: bytes, source_identifier: str) -> List[Document]:
    documents = []
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    for page_num, page in enumerate(doc):
        text = page.get_text()
        if len(text.strip()) < OCR_THRESHOLD:
            logging.warning(f"Page {page_num + 1} of '{source_identifier}': Minimal text found. Attempting OCR.")
            try:
                pix = page.get_pixmap(dpi=300)
                img_data = pix.tobytes("png")
                image = Image.open(io.BytesIO(img_data))
                text = pytesseract.image_to_string(image, lang='eng')
            except Exception as ocr_error:
                logging.error(f"OCR failed on page {page_num + 1}: {ocr_error}")
                text = ""
        metadata = {"source": source_identifier, "page_number": page_num + 1}
        documents.append(Document(page_content=text, metadata=metadata))
    logging.info(f"Successfully extracted {len(documents)} pages from '{source_identifier}'.")
    return documents

def setup_rag_pipeline(documents: List[Document]):
    logging.info(f"Setting up new RAG Pipeline with model: {MODEL_ID}")
    quantization_config = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.float16)
    model = AutoModelForCausalLM.from_pretrained(MODEL_ID, quantization_config=quantization_config, device_map="auto")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    pipeline_instance = pipeline("text-generation", model=model, tokenizer=tokenizer, max_new_tokens=256)
    llm = HuggingFacePipeline(pipeline=pipeline_instance)
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_ID)
    vectorstore = Chroma.from_documents(documents=documents, embedding=embeddings)
    retriever = vectorstore.as_retriever()
    template = "Context: {context}\nQuestion: {input}\nAnswer:"
    prompt = PromptTemplate.from_template(template)
    qa_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, qa_chain)
    logging.info("RAG pipeline is fully set up and ready. ✨")
    return rag_chain

# In app.py

def get_or_create_pipeline(pdf_url: str):
    if pdf_url in PIPELINE_CACHE:
        logging.info(f"Cache HIT for URL: {pdf_url}")
        return PIPELINE_CACHE[pdf_url]
    
    logging.info(f"Cache MISS for URL: {pdf_url}. Creating new pipeline.")
    
    # 1. Download and Extract
    response = requests.get(pdf_url, timeout=60) # Increased timeout for larger files
    response.raise_for_status()
    pdf_bytes = response.content
    documents = extract_text_from_pdf_bytes(pdf_bytes, source_identifier=pdf_url)
    if not documents:
        raise ValueError("Could not extract any content from the PDF.")

    # --- NEW: CHUNK THE DOCUMENTS ---
    logging.info("Splitting documents into smaller chunks...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    docs = text_splitter.split_documents(documents)
    logging.info(f"Created {len(docs)} document chunks.")
    
    # 3. Create and cache the pipeline USING THE CHUNKS (docs)
    # The setup_rag_pipeline function now receives the smaller chunks
    assistant = setup_rag_pipeline(docs) 
    PIPELINE_CACHE[pdf_url] = assistant
    
    return assistant

@app.route('/process-pdf', methods=['POST'])
def process_pdf():
    try:
        data = request.get_json()
        if not data or 'pdf_url' not in data or 'question' not in data:
            return jsonify({"error": "Missing 'pdf_url' or 'question' in request body"}), 400
        pdf_url = data['pdf_url']
        question = data['question']
        assistant = get_or_create_pipeline(pdf_url)
        result = assistant.invoke({"input": question})
        answer = result["answer"].strip()
        return jsonify({"answer": answer})
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to download or access the PDF from the URL: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"An internal server error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    # We run on port 5001 to avoid conflict with the Node.js server on 5000
    app.run(host='0.0.0.0', port=5001, debug=True)
