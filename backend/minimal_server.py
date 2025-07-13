#!/usr/bin/env python3
"""
Minimal server to test if basic FastAPI works
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Create minimal app
app = FastAPI(title="DataGenesis AI - Minimal Test")

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Minimal DataGenesis AI Backend is running!", "status": "success"}

@app.get("/api/health")
async def health():
    return {"status": "healthy", "server": "minimal"}

if __name__ == "__main__":
    print("🚀 Starting minimal server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")