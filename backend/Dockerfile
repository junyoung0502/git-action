# 1단계: 빌드 스테이지 (컴파일 및 패키지 설치)
FROM python:3.11-slim AS builder

WORKDIR /app

# 빌드에 필요한 최소 리눅스 패키지 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 의존성 설치
COPY pyproject.toml .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .

# 2단계: 실행 스테이지 (최종 경량 이미지)
FROM python:3.11-slim

WORKDIR /app

# 빌드 단계에서 설치된 라이브러리만 복사
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# 소스 코드 전체 복사 (controllers, models, routes, public 등 포함)
COPY . .

# 업로드 폴더 권한 설정 (이미지 업로드 기능 작동을 위해 필요)
RUN mkdir -p public/images && chmod 777 public/images

# 서버 실행 (컨테이너 내부이므로 0.0.0.0으로 개방)
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]