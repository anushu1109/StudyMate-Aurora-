# academic_assistant/prompts.py

from langchain.prompts import PromptTemplate

def get_prompt_library():
    """Returns a dictionary mapping classification names to their PromptTemplate objects."""

    # Category Group 1: Information Retrieval & Synthesis
    prompt_syllabus_inquiry = PromptTemplate.from_template(
        """You are a helpful assistant specializing in academic syllabi. Your task is to assemble a comprehensive syllabus from the provided context. Organize the information clearly with headings for Course Objectives, Learning Outcomes, Units/Modules, and Prescribed Textbooks.
        Context: {context}
        Question: {question}
        Answer: """
    )
    prompt_definition_request = PromptTemplate.from_template(
        """You are a precise academic assistant. Using ONLY the context provided, define the following term clearly and concisely. If the definition is not in the context, state that clearly.
        Context: {context}
        Term to Define: {question}
        Definition: """
    )
    prompt_summarization_request = PromptTemplate.from_template(
        """Provide a concise summary of the key points from the provided context in response to the user's question. The summary should be neutral and objective.
        Context: {context}
        Question: {question}
        Summary: """
    )
    prompt_fact_extraction = PromptTemplate.from_template(
        """Extract the specific piece of information requested by the user from the context. Provide only the fact itself.
        Context: {context}
        Question: {question}
        Extracted Fact: """
    )
    prompt_list_generation = PromptTemplate.from_template(
        """Based on the context, generate a list of items that answers the user's question. Present the items in a clear, bulleted format.
        Context: {context}
        Question: {question}
        List: """
    )

    # Category Group 2: Conceptual Understanding
    prompt_concept_explanation = PromptTemplate.from_template(
        """You are an expert educator. Based on the context provided, explain the concept in the question in a simple and easy-to-understand manner.
        Context: {context}
        Concept to Explain: {question}
        Explanation: """
    )
    prompt_comparison_request = PromptTemplate.from_template(
        """Compare and contrast the two or more items mentioned in the question, using only the information from the context. Highlight key similarities and differences.
        Context: {context}
        Items to Compare: {question}
        Comparison: """
    )
    prompt_example_request = PromptTemplate.from_template(
        """Provide a specific example of the concept mentioned in the question, based on the information available in the context.
        Context: {context}
        Concept for Example: {question}
        Example: """
    )

    # Category Group 3: Application & Problem-Solving
    prompt_problem_solving = PromptTemplate.from_template(
        """Solve the problem stated in the question using the methods and formulas described in the context. Show your work step-by-step.
        Context: {context}
        Problem: {question}
        Solution: """
    )
    prompt_code_generation = PromptTemplate.from_template(
        """You are a skilled programmer. Write a code snippet that implements the algorithm or logic described in the context to solve the user's request.
        Context: {context}
        Request: {question}
        Code: """
    )
    
    # Category Group 4: Advanced Academic Tasks
    prompt_critique_analysis = PromptTemplate.from_template(
        """Provide a critical analysis of the topic in the question, based on the context. Identify strengths, weaknesses, assumptions, and limitations.
        Context: {context}
        Topic for Critique: {question}
        Analysis: """
    )

    # Fallback / Default Prompt
    prompt_general_qa = PromptTemplate.from_template(
        """You are a helpful AI assistant. Answer the user's question based on the information provided in the context.
        Context: {context}
        Question: {question}
        Answer: """
    )


    # This dictionary is our "Router". It maps a classification to a prompt.
    PROMPT_LIBRARY = {
        "Syllabus_Inquiry": prompt_syllabus_inquiry,
        "Definition_Request": prompt_definition_request,
        "Summarization_Request": prompt_summarization_request,
        "Fact_Extraction": prompt_fact_extraction,
        "List_Generation": prompt_list_generation,
        "Concept_Explanation": prompt_concept_explanation,
        "Comparison_Request": prompt_comparison_request,
        "Example_Request": prompt_example_request,
        "Problem_Solving": prompt_problem_solving,
        "Code_Generation": prompt_code_generation,
        "Critique_And_Analysis": prompt_critique_analysis,
        "General_Query": prompt_general_qa # A fallback for unclassified queries
    }
    
    return PROMPT_LIBRARY
