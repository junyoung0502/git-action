# database.py
from sqlalchemy import create_engine, text
from config import Config

# .env 주소 우선, 없으면 기본값 사용
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{Config.DB_USER}:{Config.DB_PASS}@{Config.DB_HOST}:3306/{Config.DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)

def execute_query(query: str, params: dict = None):
    """직접 SQL을 실행하고 결과를 반환하는 유틸리티 함수"""
    with engine.connect() as connection:
        # text() 함수를 사용하여 문자열을 SQL 명령어로 변환합니다.
        result = connection.execute(text(query), params or {})
        
        # SELECT 문인 경우 결과를 딕셔너리 리스트로 변환
        if result.returns_rows:
            return [dict(row._mapping) for row in result]
        
        # INSERT/UPDATE/DELETE인 경우 영향을 받은 행의 수 반환
        connection.commit() # 변경사항 저장
        return result.rowcount