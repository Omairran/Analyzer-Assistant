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
7. "sequenceDiagram": A valid Mermaid syntax sequence diagram string starting with "sequenceDiagram" (e.g. sequenceDiagram\\n    actor User\\n    User->>Frontend: Action\\n    Frontend->>API: Request\\n    API->>DB: Query).

IMPORTANT: Return ONLY valid, raw JSON matching this structure. Do not include markdown formatting or extra text outside the JSON.
"""

class GeminiServerBusyError(Exception):
    """Exception raised when Gemini API returns 503 / UNAVAILABLE error."""
    pass

def is_503_error(e: Exception) -> bool:
    if isinstance(e, GeminiServerBusyError):
        return True
    
    err_str = str(e).upper()
    code = getattr(e, 'code', None) or getattr(e, 'status_code', None) or getattr(e, 'http_status', None)
    status = getattr(e, 'status', None)
    
    if code == 503 or status == 503 or status == 'UNAVAILABLE':
        return True
        
    keywords = ["503", "UNAVAILABLE", "MODEL IS BUSY", "SERVER IS BUSY", "OVERLOADED"]
    if any(keyword in err_str for keyword in keywords):
        return True
        
    return False

def analyze_requirements_with_gemini(text: str) -> dict:
    """
    Sends requirement text to Gemini API and returns structured JSON analysis.
    If API key is missing or request fails, falls back gracefully.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")
    if api_key:
        api_key = api_key.strip().strip('"').strip("'")
    
    if not api_key or api_key == "your_gemini_api_key_here":
        print("[Gemini Warning] GEMINI_API_KEY is not set or invalid.")
        raise ValueError("GEMINI_API_KEY environment variable is not set in backend environment.")

    try:
        response_text = None
        last_err = None

        # Attempt 1: Using google-genai SDK
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            prompt = f"{SYSTEM_PROMPT}\n\nREQUIREMENT DOCUMENT TEXT:\n{text[:10000]}"
            
            models_to_try = ['gemini-3.6-flash', 'gemini-1.5-flash', 'gemini-2.0-flash']
            for model_name in models_to_try:
                try:
                    res = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                    )
                    if res and res.text:
                        response_text = res.text
                        print(f"[Gemini Success] Successfully generated analysis using model: {model_name}")
                        break
                except Exception as err:
                    last_err = err
                    print(f"[Gemini Info] Model {model_name} unavailable: {err}")
                    if is_503_error(err):
                        raise GeminiServerBusyError("⚠️ Server is busy. Please try again in a few moments.") from err
                    continue
        except (ImportError, Exception) as genai_err:
            last_err = genai_err

        # Attempt 2: Fallback to google.generativeai SDK if needed
        if not response_text:
            try:
                import google.generativeai as legacy_genai
                legacy_genai.configure(api_key=api_key)
                prompt = f"{SYSTEM_PROMPT}\n\nREQUIREMENT DOCUMENT TEXT:\n{text[:10000]}"
                for model_name in ['gemini-1.5-flash', 'gemini-pro']:
                    try:
                        model = legacy_genai.GenerativeModel(model_name)
                        res = model.generate_content(prompt)
                        if res and res.text:
                            response_text = res.text
                            break
                    except Exception as err:
                        last_err = err
                        continue
            except Exception as leg_err:
                pass

        if not response_text:
            if last_err:
                print(f"[Gemini Error] API Call failed: {str(last_err)}")
                if is_503_error(last_err):
                    raise GeminiServerBusyError("⚠️ Server is busy. Please try again in a few moments.") from last_err
                raise last_err
            raise ValueError("No response returned from Gemini API.")
        
        raw_text = response_text.strip()
        
        # Clean markdown code blocks if present
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
            
        data = json.loads(raw_text.strip())
        return data
        
    except GeminiServerBusyError:
        raise
    except Exception as e:
        if is_503_error(e):
            raise GeminiServerBusyError("⚠️ Server is busy. Please try again in a few moments.") from e
        err_msg = str(e)
        print(f"[Warning] Gemini API call returned error: {err_msg}")
        raise e
