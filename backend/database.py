import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "")

_client = None
_db = None
_collection = None

def get_collection():
    global _client, _db, _collection
    if _collection is not None:
        return _collection
    
    if not MONGODB_URI or "<username>" in MONGODB_URI or "<password>" in MONGODB_URI:
        print("[MongoDB Notice] MONGODB_URI is not configured with actual credentials in backend/.env. Skipping MongoDB operations.")
        return None

    try:
        # Pass certifi CA certificates for SSL verification in Windows
        _client = MongoClient(
            MONGODB_URI, 
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000
        )
        # Test connection
        _client.admin.command('ping')
        _db = _client.get_database("analyzer_db")
        _collection = _db["analyses"]
        print("[MongoDB Status] Successfully connected to MongoDB Atlas!")
        return _collection
    except Exception as e:
        print(f"[MongoDB Notice] Could not connect to MongoDB Atlas: {e}")
        return None


def save_analysis(record: dict):
    """
    Saves parsed document details and AI analysis into MongoDB collection.
    """
    collection = get_collection()
    if collection is not None:
        try:
            result = collection.insert_one(record)
            print(f"[MongoDB] Analysis record inserted with id: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            print(f"[MongoDB Error] Failed to insert record: {e}")
    return None

def get_all_analyses(limit: int = 20):
    """
    Retrieves past analysis records sorted by most recent first.
    """
    collection = get_collection()
    if collection is not None:
        try:
            records = list(collection.find({}, {"_id": 0}).sort("_id", -1).limit(limit))
            return records
        except Exception as e:
            print(f"[MongoDB Error] Failed to fetch records: {e}")
    return []
