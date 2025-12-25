# 🤖 AI Agent Architecture

FlashMaster uses a multi-agent approach to handle content generation, grading, and distractor creation.

## 1. The Generator Agent 🏭
**Role**: Content Creator  
**Trigger**: Input Tab -> "Generate Flashcards" or "Generate Terms"  
**Model**: User Selectable (Default: `google/gemini-2.0-flash-exp:free`) via OpenRouter.

### Responsibilities
- **Parsing**: Takes raw user notes (unstructured text).
- **Extraction**: Identifies key Terms and Definitions.
- **Formatting**: Outputs strictly in CSV format (`Term,Definition`).
- **Context Awareness**: Uses the "Optional Context" field to disambiguate terms (e.g. "Virus" in Biology vs "Virus" in Cyber Security).

### System Prompt Strategy
```text
You are a helpful flashcard generator. extracting key terms and definitions from the user's text.
CONTEXT: [User Context]
Your output must be strictly in CSV format: TERM,DEFINITION. One per line.
Example:
Apple,A red fruit
Banana,A yellow fruit
```

---

## 2. The Grader Agent 👩‍🏫
**Role**: Evaluation & Feedback  
**Trigger**: Recall Mode -> "Submit Answer"  
**Model**: Lightweight/Fast models preferred.

### Responsibilities
- **Semantic Analysis**: Compares User Answer vs Correct Answer based on *meaning*, not string equality.
- **Scoring**: Assigns a 0-100% similarity score.
- **Feedback**: Provides a 1-sentence explanation of why it was right or wrong.
- **Resilience**: Features an **Auto-Retry** mechanism (up to 3 attempts) for handling API timeouts, 500 errors, or malformed JSON responses.

### System Prompt Strategy
```text
You are a strict study grader. Compare the User Answer to the Correct Answer. 
Give a similarity score (0-100). If score > 80, mark as CORRECT. 
Provide brief 1-sentence feedback. 
Format output as JSON: { "score": number, "correct": boolean, "message": "string" }
```

---

## 3. The Distractor Agent 🎭
**Role**: Quiz Difficulty  
**Trigger**: Quiz Mode -> AI Toggle ON  
**Model**: Capable Instruction Following models.

### Responsibilities
- **Generation**: Creates 3 "wrong" answers for every question.
- **Plausibility**: Must generate terms that exist in the real world (same domain) but are incorrect for the specific question.
- **Format**: Returns pipe-separated values.

### System Prompt Strategy
```text
You are a concise exam creator. I will give you a Term and Definition. 
Generate 3 "distractor" TERMS that are REAL, VALID industry terms from the SAME domain. 
Do NOT generate fake terms. 
Return ONLY the 3 terms separated by pipe symbol "|".
```

---

## 4. The Hint Agent 💡
**Role**: Assistance  
**Trigger**: Recall Mode -> Hint Button (Level 3 / Max Hint)  
**Model**: Fast Inference.

### Responsibilities
- **Clue Generation**: specific to Short-Term memory aids.
- **Constraint**: Must NOT use the answer word itself.

### System Prompt Strategy
```text
Give a cryptic, vague, but helpful hint for the answer: "[Answer]". 
The question/context is: "[Question]". 
Do NOT reveal the answer word itself. It should guide the user to the answer without giving it away directly. Max 15 words.
```

---

## 5. The Scenario Agent 🎭
**Role**: Complex Situation Simulation  
**Trigger**: Quiz Mode -> "Scenarios" Selected  
**Model**: Instruction-heavy Large Language Model.

### Responsibilities
- **Synthesis**: Analyze terms to find thematic relationships; create a logically cohesive scenario instead of forcing unrelated terms together.
- **Contextualization**: Prioritize the **Custom Context** field to determine the setting, tone, and specific constraints (e.g. "Focus on risk assessment").
- **Difficulty Scaling**: Adjusts linguistic complexity and nuance based on the chosen level (Easy, Medium, Hard).
- **Rationale Generation**: Explains the correct path *and* why other paths (distractors) are sub-optimal in under 50 words.

### System Prompt Strategy
```text
You are an expert exam creator. Develop a scenario-based question.
Difficulty: [Level].
USER CONTEXT (PRIORITY): [Context].

INSTRUCTIONS:
- Create a scenario that integrates the provided study terms: [Terms]
- If USER CONTEXT is provided, it MUST take precedence.
- CONSTRAINTS: Single cohesive paragraph, 4 options, concise rationale.
```

## Security & Privacy 🔐
- **Local Storage**: API Keys are stored in the browser's `localStorage` (`flashcards_api_config`).
- **Direct Traffic**: Requests go directly from Client -> OpenRouter/OpenAI. No intermediate server.
