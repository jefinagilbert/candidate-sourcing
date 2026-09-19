# LLM Prompts Repository

This directory contains the system prompts, templates, and structured JSON schemas used across the AI Recruiter Sourcing Refinement Loop.

---

## 1. Filter Extraction Prompt (`filter-extraction.prompt.ts`)
- **Purpose**: Decomposes raw recruiter requirements into (a) computable objective filters (`skills`, `min_years_experience`, `max_years_experience`, `locations`, `company_types`) and (b) subjective fit rubric criteria with percentage weights, positive signals, and negative signals.
- **Enforcement**: Strict JSON schema output with automated JSON repair and sanitization.

---

## 2. Candidate Scoring & Citation Prompt (`candidate-scoring.prompt.ts`)
- **Purpose**: Evaluates candidate profiles against the subjective fit rubric.
- **Citation Rule**: Mandatory grounded citations citing actual fields from the candidate's profile (`years_experience`, `current_company`, `current_company_type`, `past_companies`, `skills`, `education`, `summary`).
- **Output**: Match score (0-100), Fit level (`Strong Match`, `Good Match`, `Moderate Fit`, `Borderline`), grounded match explanation, and criterion breakdown.

---

## 3. Conversational Refinement Prompt (`refinement-adjustment.prompt.ts`)
- **Purpose**: Interprets recruiter conversational feedback (e.g. *"1 is too junior, 2 and 4 are right"*, *"prioritize fintech/payments experience"*, *"allow scaleups"*) and per-profile match/reject signals.
- **Output**: Updated objective filters, updated rubric weights/signals, and an explicit explanation to the recruiter detailing what changed and why.
