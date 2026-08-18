import io
from fastapi import HTTPException, UploadFile
import pypdf
import docx

async def extract_text_from_file(file: UploadFile) -> str:
    """
    Extracts text content from uploaded .txt, .pdf, or .docx file.
    """
    filename = file.filename.lower()
    content = await file.read()
    
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    extracted_text = ""
    
    try:
        if filename.endswith(".txt") or filename.endswith(".md"):
            try:
                extracted_text = content.decode("utf-8")
            except UnicodeDecodeError:
                extracted_text = content.decode("latin-1", errors="ignore")
                
        elif filename.endswith(".pdf"):
            pdf_stream = io.BytesIO(content)
            reader = pypdf.PdfReader(pdf_stream)
            text_pages = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_pages.append(page_text)
            extracted_text = "\n\n".join(text_pages)
            
        elif filename.endswith(".docx"):
            docx_stream = io.BytesIO(content)
            doc = docx.Document(docx_stream)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            extracted_text = "\n\n".join(paragraphs)
            
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format. Please upload a .txt, .pdf, or .docx file."
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse file '{file.filename}': {str(e)}"
        )
        
    if not extracted_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract readable text from the document. The file might be scanned or empty."
        )
        
    return extracted_text
