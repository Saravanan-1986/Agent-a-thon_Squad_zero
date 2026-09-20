"""
Knowledge Debt Engine - Backend Application Entry Point

Member 3 Scope: Backend + Agents Layer
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

import logging

logger = logging.getLogger("backend.main")

from backend.api.students import router as students_router
from backend.api.auth import router as auth_router
from backend.api.evidence import router as evidence_router
from backend.api.debts import router as debts_router
from backend.api.interventions import router as interventions_router
from backend.api.verification import router as verification_router
from backend.api.mentor import router as mentor_router
from backend.api.assessments import router as assessments_router
from backend.api.graph import router as graph_router
from backend.api.demo import router as demo_router
from backend.api.stream import router as stream_router
from backend.api.diagnostic import router as diagnostic_router
from backend.api.profile import router as profile_router

try:
    from database.connection import init_db
    init_db()
    logger.info("Database initialized successfully.")
except Exception as e:
    logger.warning("Database initialization skipped or failed: %s", e)

app = FastAPI(
    title="Knowledge Debt Engine API",
    description="Agentic learning system detecting and resolving persistent student conceptual debt.",
    version="1.0.0"
)

# CORS Setup for Vite / React Frontend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(students_router, prefix="/api")
app.include_router(evidence_router, prefix="/api")
app.include_router(debts_router, prefix="/api")
app.include_router(interventions_router, prefix="/api")
app.include_router(verification_router, prefix="/api")
app.include_router(mentor_router, prefix="/api")
app.include_router(graph_router, prefix="/api")
app.include_router(demo_router, prefix="/api")
app.include_router(diagnostic_router, prefix="/api")
app.include_router(profile_router, prefix="/api")
app.include_router(assessments_router)
app.include_router(stream_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to Knowledge Debt Engine API",
        "docs_url": "http://localhost:8000/docs",
        "health_check": "http://localhost:8000/api/health"
    }

@app.get("/api/health")
def health_check():
    from backend.services.multi_model_engine import engine
    status_data = engine.get_status()
    return {
        "status": "healthy",
        "service": "Knowledge Debt Engine Backend",
        "provider": status_data.get("provider"),
        "model": status_data.get("model"),
        "model_id": status_data.get("model_id"),
        "api": status_data.get("api"),
        "api_endpoint": status_data.get("api_endpoint"),
        "active_provider": status_data.get("active_provider"),
        "active_model": status_data.get("active_model"),
        "mode": status_data.get("mode"),
        "display_badge": status_data.get("display_badge"),
        "architecture_note": status_data.get("architecture_note"),
        "core_principle": "LLM proposes. Evidence decides."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
