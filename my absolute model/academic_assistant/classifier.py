from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

def create_qa_chain(self, question: str, chain_type: str = "map_reduce"):
    """
    Create a RetrievalQA chain with flexible chain_type.
    Supports: "stuff", "map_reduce", "refine"
    """

    # Step 1: Classify intent → pick prompt
    intent = self.classify_intent(question)
    selected_prompt = self.prompts.get(intent, self.prompts["General_Query"])

    if self.retriever is None:
        raise ValueError("Retriever not initialized. Call load_and_process_documents() first.")
    if self.vectorstore is None:
        raise ValueError("Vectorstore not initialized. Ensure documents are processed.")

    # Step 2: Define chain kwargs
    chain_kwargs = {}

  +  if chain_type == "stuff":
        # Simple chain
        chain_kwargs = {"prompt": selected_prompt}

    elif chain_type == "map_reduce":
        # Map prompt per doc
        map_prompt = selected_prompt
        # Combine prompt to merge
        combine_prompt = PromptTemplate.from_template(
            """You are a detailed academic assistant.
            Combine the following partial answers into one comprehensive, well-structured answer. 
            Ensure clarity, depth, and include examples if relevant.

            Context summaries:
            {summaries}

            Final Answer:"""
        )
        chain_kwargs = {"map_prompt": map_prompt, "combine_prompt": combine_prompt}

    elif chain_type == "refine":
        question_prompt = selected_prompt
        refine_prompt = PromptTemplate.from_template(
            """We have an initial answer:
            {existing_answer}

            Refine it using the new context below:
            {context}

            Improved Answer:"""
        )
        chain_kwargs = {"question_prompt": question_prompt, "refine_prompt": refine_prompt}

    else:
        raise ValueError(f"Unsupported chain_type: {chain_type}")

    # Step 3: Build RetrievalQA chain
    return RetrievalQA.from_chain_type(
        llm=self.llm,
        chain_type=chain_type,
        retriever=self.retriever,
        chain_type_kwargs=chain_kwargs,
        return_source_documents=True,
    )
