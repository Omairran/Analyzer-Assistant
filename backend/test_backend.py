import io
import asyncio
from unittest.mock import patch
from fastapi import UploadFile
from main import read_root, upload_file, SavePayload, UploadResponse
from database import get_all_analyses

def test_read_root():
    """Verify backend health check function."""
    res = read_root()
    assert res["status"] == "online"
    assert "AI Requirement Analyzer API" in res["app"]
    assert "/api/upload" in res["endpoints"]

def test_upload_text_file():
    """Test text file parsing and response generation logic."""
    sample_text = (
        "Project Requirement: Build a user authentication API.\n"
        "Users can register with email and password.\n"
        "System must support JWT tokens and password hashing."
    )
    file_bytes = sample_text.encode("utf-8")
    upload_file_obj = UploadFile(filename="requirement.txt", file=io.BytesIO(file_bytes))
    
    mock_ai = {
        "summary": "Mock summary",
        "acceptanceCriteria": ["Criteria 1"],
        "tasks": [],
        "dbTables": [],
        "apis": [],
        "sequenceDiagram": "sequenceDiagram"
    }

    with patch("main.analyze_requirements_with_gemini", return_value=mock_ai):
        # Run async upload endpoint
        res = asyncio.run(upload_file(
            file=upload_file_obj,
            authorization="Bearer demo-token-test",
            x_user_role="Analyst"
        ))
        
        assert isinstance(res, UploadResponse)
        assert res.filename == "requirement.txt"
        assert res.word_count > 0
        assert "authentication API" in res.extracted_text

def test_database_get_all_analyses():
    """Test retrieving database history records."""
    records = get_all_analyses(limit=10)
    assert isinstance(records, list)

if __name__ == "__main__":
    print("Running backend API tests...")
    test_read_root()
    print("[PASS] test_read_root passed.")
    test_upload_text_file()
    print("[PASS] test_upload_text_file passed.")
    test_database_get_all_analyses()
    print("[PASS] test_database_get_all_analyses passed.")
    print("\n--- ALL BACKEND API TESTS PASSED SUCCESSFULLY ---")
