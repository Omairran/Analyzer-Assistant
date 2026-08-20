import os
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

SYSTEM_PROMPT = """
You are an expert AI Software Architect and Requirement Analyst.
Analyze the following requirement text extracted from a software document and output a JSON object containing:
1. "summary": A concise executive summary of the project requirements.
2. "acceptanceCriteria": A list of testable acceptance criteria strings.
3. "tasks": A list of development tasks, each with "title" and "complexity" ("Low", "Medium", or "High").
4. "dbTables": A list of database tables, each with "name" and "columns" (list of column names).
5. "apis": A list of REST API endpoints, each with "method" ("GET", "POST", "PUT", or "DELETE"), "endpoint" (path string), and "description".
6. "edgeCases": A list of identified missing requirements, risks, or edge cases.

IMPORTANT: Return ONLY valid, raw JSON matching this structure. Do not include markdown formatting or extra text outside the JSON.
"""

def analyze_requirements_with_gemini(text: str) -> dict:
    """
    Sends requirement text to Gemini API and returns structured JSON analysis.
    If API key is missing or request fails, falls back gracefully.
    """
    api_key = os.getenv("GEMINI_API_KEY", "AIzaSyCtKmbpiK0boY_AitQa6Ug-z1rcdRCD2hA")
    
    if not api_key or api_key == "your_gemini_api_key_here":
        raise ValueError("GEMINI_API_KEY environment variable is not set in backend/.env")


    
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        
        prompt = f"{SYSTEM_PROMPT}\n\nREQUIREMENT DOCUMENT TEXT:\n{text[:10000]}"
        
        response = None
        # Try candidate model names for compatibility
        models_to_try = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-3.6-flash']
        last_err = None
        
        for model_name in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                if response and response.text:
                    break
            except Exception as err:
                last_err = err
                continue

        if not response or not response.text:
            if last_err:
                raise last_err
            raise ValueError("No response returned from Gemini API.")
        
        raw_text = response.text.strip()
        
        # Clean markdown code blocks if present
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
            
        data = json.loads(raw_text.strip())
        return data
        
    except Exception as e:
        err_msg = str(e)
        print(f"[Warning] Gemini API call returned error: {err_msg}")
        raise e

