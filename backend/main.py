import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from parser import extract_text_from_file

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
    message: str

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "AI Requirement Analyzer API",
        "version": "1.0.0",
        "endpoints": ["/api/upload", "/docs"]
    }

@app.post("/api/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    Accepts file upload (PDF, Word DOCX, Text), parses text content,
    and returns structured document metadata.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded.")
    
    # Read text using parser
    extracted_text = await extract_text_from_file(file)
    
    words = extracted_text.split()
    word_count = len(words)
    char_count = len(extracted_text)
    
    return UploadResponse(
        filename=file.filename,
        content_type=file.content_type or "unknown",
        file_size_bytes=len(extracted_text.encode('utf-8')),
        word_count=word_count,
        char_count=char_count,
        extracted_text=extracted_text,
        message="File uploaded and parsed successfully."
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
