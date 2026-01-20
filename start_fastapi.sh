#!/bin/bash

# Target directory for the FastAPI server
SERVER_DIR="/Users/frankenstein/Documents/Work/Claw Mater/Mock API/Mock Data/fast_api_server_files/Current Server"

echo "Checking for FastAPI server at: $SERVER_DIR"

if [ -d "$SERVER_DIR" ]; then
    cd "$SERVER_DIR"
    echo "Starting FastAPI server on port 8000..."
    uvicorn server:app --reload --port 8000
else
    echo "Error: Server directory not found at $SERVER_DIR"
    exit 1
fi
