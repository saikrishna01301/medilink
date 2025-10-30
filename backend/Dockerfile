# ===================================
# MediLink Backend - Production Dockerfile
# ===================================
# Multi-stage build for optimized image size and security
# Supports: FastAPI, PostgreSQL, Alembic migrations, Cloud SQL

# ===================================
# Stage 1: Builder
# ===================================
FROM python:3.11-slim as builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies in a virtual environment
# Using venv for better isolation
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ===================================
# Stage 2: Runtime
# ===================================
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Set environment variables
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Create non-root user for security
RUN groupadd -r medilink && useradd -r -g medilink medilink

# Copy application code
COPY --chown=medilink:medilink . .

# Change ownership of app directory
RUN chown -R medilink:medilink /app

# Switch to non-root user
USER medilink

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/auth/health || exit 1

# Run database migrations and start the application
# Note: In production, you might want to run migrations separately
# Matches local dev workflow: cd backend -> alembic, cd backend/app -> uvicorn main:app
CMD ["sh", "-c", "alembic upgrade head && cd app && uvicorn main:app --host 0.0.0.0 --port 8000"]