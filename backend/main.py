"""
Knowledge Debt Engine - Backend Application Entry Point

Member 3 Scope: Backend + Agents Layer
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from backend.api.students import router as students_router
from backend.api.evidence import router as evidence_router
from backend.api.debts import router as debts_router
from backend.api.interventions import router as interventions_router
from backend.api.verification import router as verification_router
from backend.api.mentor import router as mentor_router

app = FastAPI(
    title="Knowledge Debt Engine API",
    description="Agentic learning system detecting and resolving persistent student conceptual debt.",
    version="1.0.0"
)

# CORS Setup for Vite / React Frontend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under /api
app.include_router(students_router, prefix="/api")
app.include_router(evidence_router, prefix="/api")
app.include_router(debts_router, prefix="/api")
app.include_router(interventions_router, prefix="/api")
app.include_router(verification_router, prefix="/api")
app.include_router(mentor_router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Knowledge Debt Engine Backend",
        "core_principle": "LLM proposes. Evidence decides."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
