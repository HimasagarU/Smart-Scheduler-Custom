# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements file first to leverage Docker cache
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend source code
COPY . .

# Expose port
EXPOSE 8000

# Command to run the Fast API server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
