from pydantic import BaseModel
from typing import Optional, List, Dict

class InvoiceData(BaseModel):
    invoice_number: str
    Store_name: str
    date: str
    total_amount: float
    due_date: Optional[str] = None

class InvoiceResponse(BaseModel):
    document_type: str
    department: str
    priority: str
    action: str
    extracted_data: InvoiceData
    status: str


class ResumeData(BaseModel):
    candidate_name: str
    email: str
    phone: str
    skills: List[str]
    experience_years: str
    education: str
    missing_skills: List[str]
    summary: str

class ResumeResponse(BaseModel):
    document_type: str
    department: str
    priority: str
    action: str    # ✅ ADDED
    extracted_data: ResumeData
    status: str


class ReportData(BaseModel):
    summary: str
    metrics: Dict
    risks: List

class ReportResponse(BaseModel):
    document_type: str
    department: str
    extracted_data: ReportData
    notes: str
