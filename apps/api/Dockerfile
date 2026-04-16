FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /workspace

COPY requirements.txt /workspace/requirements.txt
COPY apps/api /workspace/apps/api

RUN pip install --no-cache-dir -r /workspace/requirements.txt \
    && pip install --no-cache-dir -e /workspace/apps/api

WORKDIR /workspace/apps/api

EXPOSE 8000
