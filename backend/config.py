# config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Server
    BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8000")
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    
    # Database
    DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
    DB_USER = os.getenv("DB_USER", "server")
    DB_PASS = os.getenv("DB_PASS", "server123")
    DB_NAME = os.getenv("DB_NAME", "community_db")
    
    # AWS (추가하신 설정 반영)
    S3_BUCKET = os.getenv("S3_BUCKET_NAME")
    UPLOAD_API_URL = os.getenv("UPLOAD_API_URL")