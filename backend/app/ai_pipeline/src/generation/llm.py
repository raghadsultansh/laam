"""
Module for handling the LLM generation and reasoning logic.
Supports swapping between closed-source (e.g., GPT-4o) and open-source fine-tuned models.
"""
from langchain_openai import ChatOpenAI
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.output_parsers import StrOutputParser
from src.generation.prompts import QA_PROMPT

class AnswerGenerator:
    def __init__(self, llm_override: BaseChatModel = None, model_name: str = "gpt-4o", temperature: float = 0.0):
        # Extremely easy abstraction: Switch out API model for a local fine-tuned HuggingFace pipeline explicitly
        if llm_override:
            self.llm = llm_override
        else:
            self.llm = ChatOpenAI(model=model_name, temperature=temperature)
            
        self.chain = QA_PROMPT | self.llm | StrOutputParser()

    def _build_context_string(self, retrieved_docs: list) -> str:
        """
        Explodes retrieved chunks dynamically and injects the precise metadata (Page, Section, Type) 
        directly into the text flow so the LLM is explicitly aware of source boundaries.
        """
        context_parts = []
        for i, doc in enumerate(retrieved_docs):
            page_meta = doc.metadata.get("page", "Unknown Page")
            section_meta = doc.metadata.get("section", "Unknown Section")
            chunk_type = doc.metadata.get("chunk_type", "text")
            
            context_parts.append(
                f"--- Evidence {i+1} [Type: {chunk_type}] (Page: {page_meta} | Section: {section_meta}) ---\n"
                f"{doc.page_content}\n"
            )
        return "\n\n".join(context_parts)

    def generate_answer(self, query: str, retrieved_docs: list) -> str:
        """
        Assembles context and prompts LLM for final answer.
        """
        formatted_context = self._build_context_string(retrieved_docs)
        
        raw_output = self.chain.invoke({
            "context": formatted_context, 
            "question": query
        })
        
        # Keep the entire reasoning and output intact
        clean_answer = raw_output.strip()
        
        # Remove any stray markers if the LLM output them loosely
        if "FINAL ANSWER:" in clean_answer:
             clean_answer = clean_answer.replace("FINAL ANSWER:", "\n**Final Answer**:").strip()
             
        return clean_answer
