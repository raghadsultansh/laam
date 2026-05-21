# Final RAG Evaluation Report

Generated: 2026-05-12 10:19:42

## Summary

- Questions evaluated: 100
- Successful pipeline answers: 100
- Failed pipeline answers: 0
- Approximate answer accuracy: 60.96%
- Overall score: 0.6096
- Answer correctness: 0.6697
- Answer relevance: 0.8547
- Faithfulness proxy: 0.3186
- Context precision: 0.7433
- Context recall: 0.5219
- Average response time: 19.5976 seconds

## Method Note

This final report uses deterministic scoring over the saved outputs from the real RAG pipeline. It compares generated answers to ground-truth answers and supporting evidence from the financial reports. This avoids another fragile live RAGAS evaluator run while still evaluating the actual system answers.