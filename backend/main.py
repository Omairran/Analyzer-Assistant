import os
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from parser import extract_text_from_file
from ai_service import analyze_requirements_with_gemini, GeminiServerBusyError, is_503_error
from database import save_analysis, get_all_analyses
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

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "AI Requirement Analyzer API",
        "version": "1.0.0",
        "endpoints": ["/api/upload", "/api/history", "/docs"]
    }

@app.post("/api/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    Accepts file upload (PDF, Word DOCX, Text), parses text content,
    runs Gemini AI analysis if API key is set, and returns structured analysis.
    Saves analysis record to MongoDB if configured.
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
    
    # Construct analysis record & save to MongoDB Atlas
    record = {
        "filename": file.filename,
        "content_type": file.content_type or "unknown",
        "file_size_bytes": len(extracted_text.encode('utf-8')),
        "word_count": word_count,
        "char_count": char_count,
        "extracted_text": extracted_text,
        "analysis": ai_analysis,
        "created_at": datetime.utcnow().isoformat()
    }
    save_analysis(record)
    
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

@app.get("/api/history")
def get_history(limit: int = 20):
    """
    Retrieves past requirement analyses stored in MongoDB Atlas.
    """
    records = get_all_analyses(limit=limit)
    return {
        "count": len(records),
        "history": records
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

