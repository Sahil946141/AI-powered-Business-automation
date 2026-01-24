# Prompt for Invoice part
from langchain_core.prompts import PromptTemplate

INVOICE_PROMPT = PromptTemplate(
    input_variables=["text"],
    template="""
You are a business invoice understanding AI.

Return ONLY valid JSON in this format:

{{
  "document_type": "invoice",
  "department": "Accounts",
  "priority": "",
  "action": "",
  "extracted_data": {{
    "invoice_number": "",
    "store_name": "",
    "date": "",
    "total_amount": 0,
    "due_date": ""
  }},
  "status": "Verified"
}}

IMPORTANT: Leave "priority" and "action" as empty strings - these are user inputs and will be filled by the user during review.

- "Verified" → all fields correctly extracted
- "Partial" → some fields may be missing
- "Needs Review" → extraction uncertain, human should check

Invoice Text:
{text}

JSON:
"""
)

# Resume part
RESUME_PROMPT = PromptTemplate(
    input_variables=["text", "job_description"],
    template="""
You are an AI resume screening assistant.

Compare the resume with the job description and return ONLY valid JSON:

{{
  "document_type": "resume",
  "department":"",
  "priority": "",
  "action": "",
  "extracted_data": {{
    "candidate_name": "",
    "email": "",
    "phone": "",
    "skills": [],
    "experience_years": "",
    "education": "",
    "missing_skills": [],
    "summary": ""
  }},
  "status": "Verified"
}}

Status rules:
Verified → confident
Partial → some fields missing
Needs Review → unclear

Job Description:
{job_description}

Resume Text:
{text}

JSON:
"""
)

# prompts.py

REPORT_PROMPT_MINIMAL = """
You are a business AI assistant.

Analyze this report and extract ONLY the essential information needed for Management:

1. summary → main insights of the report
2. metrics → key numbers like Revenue, Completion, Budget
3. risks → any risks or issues that require attention

Always assign:
- department = Management
- action = Review
- priority = High if urgent issues exist, else Medium

Return JSON ONLY in this format:
{{
  "document_type": "...",
  "department": "...",
  "priority": "...",
  "action": "...",
  "extracted_data": {{
    "summary": "",
    "metrics": {{}},
    "risks": []
  }},
  "notes": ""
}}
Use the following text:
{text}
"""

