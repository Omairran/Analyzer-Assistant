import os
import certifi
from bson import ObjectId
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

def get_all_analyses(limit: int = 50):
    """
    Retrieves past analysis records sorted by most recent first.
    Includes 'id' string field for frontend manipulation.
    """
    collection = get_collection()
    if collection is not None:
        try:
            raw_records = list(collection.find({}).sort("_id", -1).limit(limit))
            formatted_records = []
            for r in raw_records:
                record_id = str(r["_id"])
                del r["_id"]
                r["id"] = record_id
                formatted_records.append(r)
            return formatted_records
        except Exception as e:
            print(f"[MongoDB Error] Failed to fetch records: {e}")
    return []

def delete_analysis(record_id: str):
    """
    Deletes an analysis record from MongoDB by ObjectId string or filename.
    """
    collection = get_collection()
    if collection is not None:
        try:
            query = {}
            if ObjectId.is_valid(record_id):
                query = {"_id": ObjectId(record_id)}
            else:
                query = {"filename": record_id}
                
            res = collection.delete_one(query)
            return res.deleted_count > 0
        except Exception as e:
            print(f"[MongoDB Error] Failed to delete record {record_id}: {e}")
    return False

def rename_analysis(record_id: str, new_filename: str):
    """
    Renames the filename of an analysis record in MongoDB.
    """
    collection = get_collection()
    if collection is not None:
        try:
            query = {}
            if ObjectId.is_valid(record_id):
                query = {"_id": ObjectId(record_id)}
            else:
                query = {"filename": record_id}
                
            res = collection.update_one(query, {"$set": {"filename": new_filename}})
            return res.modified_count > 0
        except Exception as e:
            print(f"[MongoDB Error] Failed to rename record {record_id}: {e}")
    return False
