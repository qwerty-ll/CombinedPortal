# --- Stage 1: Build Vite Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
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
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir httpx psycopg2-binary passlib[bcrypt]

# Copy backend application code
COPY backend ./backend

# Copy built frontend static assets into backend static folder
COPY --from=frontend-builder /app/dist ./backend/static

EXPOSE 8000

ENV PYTHONUNBUFFERED=1

CMD ["python3", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
