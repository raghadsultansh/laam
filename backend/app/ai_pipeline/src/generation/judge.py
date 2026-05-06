"""
Module for the LLM Evidence Judge.
This acts as a smart filter between the Vector Store retrieval and the Final Generator.
"""
from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document

class JudgeDecision(BaseModel):
    relevant_chunk_ids: List[int] = Field(
        description="A list of chunk indices (e.g., [0, 2, 5]) that provide the strongest, most direct evidence for the query. Only select chunks that are actually helpful."
    )
    is_sufficient: bool = Field(
        description="True if the selected chunks contain enough direct evidence to fully answer the query without hallucinating. False otherwise."
    )
    requires_calculation: bool = Field(
        description="True if the query explicitly asks for or implies a mathematical operation (e.g., percentage change, delta, sum, ratio, YoY comparison)."
    )
    requires_multi_chunk: bool = Field(
        description="True if synthesizing answers requires reading across multiple distinct chunks to piece together the answer."
    )
    query_type: Literal["factual", "numerical", "descriptive", "irrelevant"] = Field(
        description="Classify the type of question."
    )
    confidence_rationale: str = Field(
        description="A 1-2 sentence internal reasoning explaining why these chunks were selected and the math/logic approach needed. Strictly internal."
    )

class EvidenceJudge:
    def __init__(self, model_name: str = "gpt-4o", temperature: float = 0.0):
        self.llm = ChatOpenAI(model=model_name, temperature=temperature)
        self.structured_llm = self.llm.with_structured_output(JudgeDecision)
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert financial auditor acting as an Evidence Judge.
You are given a user query and a set of retrieved document chunks.
Your job is NOT to answer the query.
Your job is to analyze the chunks, select the specific ones that contain the evidence needed, and classify the mathematical and factual needs of the query.

CRITICAL RULES:
1. Only select the indices of chunks that are highly relevant. If an index is useless, exclude it.
2. If the user asks for a calculation (like percentage increase), set `requires_calculation` to True.
3. Be brutally honest about `is_sufficient`. If the chunks explicitly DO NOT contain the information, set it to False.
"""),
            ("human", """User Query: {query}

Retrieved Candidates:
{context}

Output your structured JSON decision now:""")
        ])
        
        self.chain = self.prompt | self.structured_llm

    def judge_evidence(self, query: str, retrieved_docs: list[Document]) -> JudgeDecision:
        """
        Passes candidates through the LLM out-of-band to get an intelligent evidence routing decision.
        Returns a Pydantic object representing the decision.
        """
        context_parts = []
        for i, doc in enumerate(retrieved_docs):
            page_meta = doc.metadata.get("page", "Unknown")
            section_meta = doc.metadata.get("section", "Unknown")
            context_parts.append(
                f"--- [Index: {i}] (Page: {page_meta} | Section: {section_meta}) ---\n"
                f"{doc.page_content}\n"
            )
        formatted_context = "\n\n".join(context_parts)
        
        decision = self.chain.invoke({
            "query": query, 
            "context": formatted_context
        })
        
        return decision
