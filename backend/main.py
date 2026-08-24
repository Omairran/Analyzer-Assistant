import os
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from parser import extract_text_from_file
from ai_service import analyze_requirements_with_gemini, GeminiServerBusyError, is_503_error
from database import save_analysis, get_all_analyses, delete_analysis, rename_analysis
from typing import Optional, Dict, Any


app = FastAPI(
    title="AI Requirement Analyzer API",
    description="Backend microservice for document parsing and AI analysis",
    version="1.0.0"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UploadResponse(BaseModel):
    filename: str
    content_type: str
    file_size_bytes: int
    word_count: int
    char_count: int
    extracted_text: str
    analysis: Optional[Dict[str, Any]] = None
    message: str

class RenamePayload(BaseModel):
    filename: str

class SavePayload(BaseModel):
    filename: str
    content_type: Optional[str] = "unknown"
    file_size_bytes: Optional[int] = 0
    word_count: Optional[int] = 0
    char_count: Optional[int] = 0
    extracted_text: Optional[str] = ""
    analysis: Optional[Dict[str, Any]] = None

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "AI Requirement Analyzer API",
        "version": "1.0.0",
        "endpoints": ["/api/upload", "/api/save", "/api/history", "/docs"]
    }

@app.post("/api/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    Accepts file upload (PDF, Word DOCX, Text), parses text content,
    runs Gemini AI analysis if API key is set, and returns structured analysis.
    Does NOT save to database automatically - user approval is required.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded.")
    
    # Read text using parser
    extracted_text = await extract_text_from_file(file)
    
    words = extracted_text.split()
    word_count = len(words)
    char_count = len(extracted_text)
    
    ai_analysis = None
    try:
        ai_analysis = analyze_requirements_with_gemini(extracted_text)
    except (GeminiServerBusyError, Exception) as e:
        if is_503_error(e):
            raise HTTPException(
                status_code=503,
                detail="⚠️ Server is busy. Please try again in a few moments."
            )
        print(f"[Notice] Gemini API call skipped or failed: {str(e)}")
    
    return UploadResponse(
        filename=file.filename,
        content_type=file.content_type or "unknown",
        file_size_bytes=len(extracted_text.encode('utf-8')),
        word_count=word_count,
        char_count=char_count,
        extracted_text=extracted_text,
        analysis=ai_analysis,
        message="File uploaded and processed successfully."
    )

@app.post("/api/save")
def save_record(payload: SavePayload):
    """
    Explicitly saves an analysis record to MongoDB when approved by the user.
    """
    record = {
        "filename": payload.filename,
        "content_type": payload.content_type,
        "file_size_bytes": payload.file_size_bytes,
        "word_count": payload.word_count,
        "char_count": payload.char_count,
        "extracted_text": payload.extracted_text,
        "analysis": payload.analysis,
        "created_at": datetime.utcnow().isoformat()
    }
    rec_id = save_analysis(record)
    return {"message": "Record saved successfully to MongoDB.", "id": rec_id}

@app.get("/api/history")
def get_history(limit: int = 50):
    """
    Retrieves past requirement analyses stored in MongoDB Atlas.
    """
    records = get_all_analyses(limit=limit)
    return {
        "count": len(records),
        "history": records
    }

@app.delete("/api/history/{record_id}")
def delete_history_record(record_id: str):
    """
    Deletes a specific requirement analysis record from MongoDB.
    """
    success = delete_analysis(record_id)
    if not success:
        raise HTTPException(status_code=404, detail="Record not found or delete failed.")
    return {"message": "Record deleted successfully.", "id": record_id}

@app.patch("/api/history/{record_id}")
def rename_history_record(record_id: str, payload: RenamePayload):
    """
    Renames a specific requirement analysis record's filename in MongoDB.
    """
    if not payload.filename or not payload.filename.strip():
        raise HTTPException(status_code=400, detail="Filename cannot be empty.")
        
    success = rename_analysis(record_id, payload.filename.strip())
    if not success:
        raise HTTPException(status_code=404, detail="Record not found or rename failed.")
    return {"message": "Record renamed successfully.", "id": record_id, "filename": payload.filename.strip()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
