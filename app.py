from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from uuid import uuid4
from agents.loaders import load_document
from agents.brain import ai_brain
import requests

app = FastAPI()

# ---------------------------
# CORS Configuration
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:3000",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Uploads folder
# ---------------------------
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---------------------------
# Helper function: save uploaded file
# ---------------------------
def save_file(upload_file: UploadFile) -> str:
    file_path = os.path.join(UPLOAD_DIR, f"{uuid4()}_{upload_file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    return file_path

# ---------------------------
# Process Invoice
# ---------------------------
@app.post("/process-invoice")
async def process_invoice(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith((".pdf", ".docx", ".txt")):
            raise HTTPException(status_code=400, detail="Unsupported file type")

        file_path = save_file(file)
        text = load_document(file_path)
        result = ai_brain.process_invoice(text)

        return result

    except Exception as e:
        print("🔥 PROCESS INVOICE ERROR:", str(e))
        raise HTTPException(status_code=500, detail=f"Invoice processing failed: {str(e)}")

# ---------------------------
# Process Resume
# ---------------------------
@app.post("/process-resume")
async def process_resume(file: UploadFile = File(...), job_description: str = Form(...)):
    try:
        if not file.filename.lower().endswith((".pdf", ".docx", ".txt")):
            raise HTTPException(status_code=400, detail="Unsupported file type")

        file_path = save_file(file)
        text = load_document(file_path)
        result = ai_brain.process_resume(text, job_description)

        return result

    except Exception as e:
        print("🔥 PROCESS RESUME ERROR:", str(e))
        raise HTTPException(status_code=500, detail=f"Resume processing failed: {str(e)}")

# ---------------------------
# Process Report
# ---------------------------
@app.post("/process-report")
async def process_report(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith((".pdf", ".docx", ".txt")):
            raise HTTPException(status_code=400, detail="Unsupported file type")

        file_path = save_file(file)
        text = load_document(file_path)
        result = ai_brain.process_report(text)

        return result

    except Exception as e:
        print("🔥 PROCESS REPORT ERROR:", str(e))
        raise HTTPException(status_code=500, detail=f"Report processing failed: {str(e)}")

# ---------------------------
# Confirm Data (Forward to n8n)
# ---------------------------
@app.post("/confirm")
async def confirm_data(payload: dict):
    n8n_webhook_url = "https://sahil2006.app.n8n.cloud/webhook-test/business-automation"

    try:
        user_id = payload.get("user_id")
        timestamp = payload.get("timestamp")
        doc_type = payload.get("human_corrected_output", {}).get("document_type")
        department = payload.get("human_corrected_output", {}).get("department")
        priority = payload.get("human_corrected_output", {}).get("priority")

        print(f"[CONFIRM] User {user_id} confirmed at {timestamp}")
        print(f"[CONFIRM] Document Type: {doc_type}")
        print(f"[CONFIRM] Department: {department}")
        print(f"[CONFIRM] Priority: {priority}")

        if payload.get("confirmed") is True:
            response = requests.post(n8n_webhook_url, json=payload, timeout=10)
            if response.status_code != 200:
                raise HTTPException(
                    status_code=500,
                    detail=f"n8n webhook failed: {response.status_code} {response.text}"
                )

            return {
                "status": "success",
                "message": "Data confirmed and sent to n8n automation",
                "n8n_status": response.status_code,
                "n8n_response": response.text,
                "confirmed_at": timestamp,
                "user_id": user_id
            }

        else:
            return {
                "status": "ignored",
                "message": "Payload not confirmed, not sent to n8n",
                "confirmed_at": timestamp,
                "user_id": user_id
            }

    except Exception as e:
        print("🔥 CONFIRMATION ERROR:", str(e))
        raise HTTPException(status_code=500, detail=f"Failed to process confirmation: {str(e)}")
