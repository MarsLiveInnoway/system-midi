# ---- Stage 1: Build the Next.js Frontend ----
# Use a Node.js image to build our static frontend assets
FROM node:18-slim as frontend-builder

WORKDIR /app

# Copy only the frontend folder contents
COPY frontend/ ./

# Install dependencies and build the static site
RUN npm install
RUN npm run build


# ---- Stage 2: Build the final Python Application ----
# Use a Python image for the FastAPI backend
FROM python:3.10-slim

WORKDIR /app

# Copy Python requirements first for better caching
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend code
COPY backend/ .

# Copy the built frontend static files from the 'frontend-builder' stage
# The 'next build' command with 'output: export' places files in the 'out' directory
COPY --from=frontend-builder /app/out ./static

# Expose the port the app will run on
EXPOSE 7860

# Command to run the Uvicorn server
# Hugging Face Spaces expects the app to run on port 7860
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]