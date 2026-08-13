# --- Stage 1: Build Vite Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY client/package*.json ./
RUN npm ci
COPY client ./
RUN npm run build

# --- Stage 2: Python Backend Environment ---
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY server/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY server ./server

# Copy built frontend static assets into backend static folder
COPY --from=frontend-builder /app/dist ./server/static

EXPOSE 8000

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/server

CMD ["python3", "-m", "uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8000"]
