from fastapi import APIRouter, HTTPException, Body
from dotenv import load_dotenv
import os
import openai

load_dotenv(dotenv_path=".env")

router = APIRouter(prefix="/ai", tags=["ai"])
openai_api_key = os.getenv("OPENAI_API_KEY")
client = openai.OpenAI(api_key=openai_api_key)


@router.post("/question-detail")
def question_detail(title: str = Body(...), description: str = Body(...)):
    if not openai_api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not set")
    prompt = f"""
# SYSTEM INSTRUCTIONS:
You are a strict DSA tutor writing study material — **NOT solving the problem**. You may NOT include code. You must explain visually and structurally.

Write a markdown explanation following these **strict rules and sections**:

---

## 🔹 Summary (2–3 lines)  
Explain what kind of thinking this problem is testing. Do NOT mention code.

---

## 🔸 Key Concepts (3–4 bullets)  
- What concept is core to solving this problem?  
- What patterns or DSA topics are involved?  
- What edge cases or misconceptions might arise?  
- What should a student think about before starting?

---

## ✍️ Example (Only 1, no code)  
Give one small, clear example **with input and expected output only**.  
Describe the transition in words, not code.

---

## 🎨 Visualization (Mermaid Diagram REQUIRED)  
Use a **mermaid** diagram in a markdown code block.

Example syntax:  
```mermaid
graph LR
A[Left Pointer] --> B[Compare Characters] --> C[Right Pointer]
Keep it simple but relevant (pointer movement, recursion, state transition, etc.).
If nothing obvious fits, invent a helpful analogy or suggest a Google Image keyword like:
"Search: two pointers string visualization"

💡 Time/Space Hint
Give a small nudge, not the answer.
Examples:

“How many elements are visited?”

“Does space usage grow with input?”

❗ RULES (Follow Strictly)
❌ NO code

❌ NO pseudocode

❌ NO implementation

✅ USE all 5 sections above

✅ MUST include Mermaid

✅ Format as markdown

TASK
Title: {title}

Description: {description}
"""
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.7,
        )
        return {"detail": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
