FROM python:3.10-slim

WORKDIR /app

# Install OS dependencies required by opencv-python-headless
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose port and run uvicorn
ENV PORT=8001
EXPOSE 8001
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
