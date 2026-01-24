import json, re
from langchain_google_genai import ChatGoogleGenerativeAI
from .prompts import INVOICE_PROMPT, RESUME_PROMPT, REPORT_PROMPT_MINIMAL
from .schemas import *
from config import Access

class AIBrain:

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="models/gemini-2.5-flash-lite",
            google_api_key=Access.Google_Gemini,
            temperature=0
        )

    # -------------------
    # Helpers
    # -------------------
    def _extract_json(self, text: str):
        match = re.search(r"\{.*\}", text, re.S)
        return match.group(0) if match else None

    def _clean(self, text: str):
        return re.sub(r"^```(?:json)?|```$", "", text, flags=re.S).strip()

    # -------------------
    # Invoice
    # -------------------
    def process_invoice(self, text: str) -> InvoiceResponse:
        response = self.llm.invoke(INVOICE_PROMPT.format(text=text))
        raw = self._extract_json(response.content)

        if not raw:
            return self._default_invoice_response()

        data = json.loads(raw)
        extracted = data.get("extracted_data", {})

        if "vendor_name" in extracted:
            extracted["Store_name"] = extracted.pop("vendor_name")
        elif "store_name" in extracted:
            extracted["Store_name"] = extracted.pop("store_name")

        extracted.setdefault("invoice_number", "")
        extracted.setdefault("Store_name", "")
        extracted.setdefault("date", "")
        extracted.setdefault("due_date", "")

        try:
            extracted["total_amount"] = float(extracted.get("total_amount", 0))
        except:
            extracted["total_amount"] = 0.0

        return InvoiceResponse(
            document_type=data.get("document_type", "invoice"),
            department=data.get("department", ""),
            priority=data.get("priority", ""),
            action=data.get("action", ""),
            extracted_data=InvoiceData(**extracted),
            status=data.get("status", "Needs Review")
        )

    # -------------------
    # Resume
    # -------------------
    def process_resume(self, text: str, job_description: str) -> ResumeResponse:
        response = self.llm.invoke(RESUME_PROMPT.format(text=text, job_description=job_description))
        raw = self._extract_json(response.content)

        if not raw:
            return self._default_resume_response()

        data = json.loads(raw)
        extracted = data.get("extracted_data", {})

        defaults = {
            "candidate_name": "",
            "email": "",
            "phone": "",
            "skills": [],
            "experience_years": "",
            "education": "",
            "missing_skills": [],
            "summary": ""
        }
        for k,v in defaults.items():
            extracted.setdefault(k, v)

        return ResumeResponse(
            document_type=data.get("document_type","resume"),
            department=data.get("department",""),
            priority=data.get("priority",""),
            action=data.get("action",""),
            extracted_data=ResumeData(**extracted),
            status=data.get("status","Needs Review")
        )

    # -------------------
    # Report
    # -------------------
    def process_report(self, text:str) -> ReportResponse:
        response = self.llm.invoke(REPORT_PROMPT_MINIMAL.format(text=text))
        raw = self._extract_json(response.content)

        data = json.loads(raw)
        extracted = data.get("extracted_data",{})

        extracted.setdefault("summary","")
        extracted.setdefault("metrics",{})
        extracted.setdefault("risks",[])

        return ReportResponse(
            document_type=data.get("document_type","report"),
            department=data.get("department","Management"),
            extracted_data=ReportData(**extracted),
            notes=data.get("notes","")
        )

ai_brain = AIBrain()
