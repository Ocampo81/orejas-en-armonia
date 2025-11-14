# backend/app/main.py
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# 1) Cargar variables de entorno LO PRIMERO
load_dotenv()

from .database import Base, engine
from . import models  # noqa: F401
from .routers import leads as leads_router
from .routers import cases as cases_router
from .admin_auth import router as admin_auth_router

# Crear tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Orejas en Armonía API")

# CORS
default_origins = ["http://127.0.0.1:5500", "http://localhost:5500"]
env_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
allow_origins = env_origins or default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers normales
app.include_router(leads_router.router, prefix="/api", tags=["leads"])
app.include_router(cases_router.router, prefix="/api", tags=["cases"])

# Router de autenticación admin (quedará /api/admin/...)
app.include_router(admin_auth_router, prefix="/api", tags=["admin-auth"])


@app.get("/")
def root():
    return {"ok": True, "service": "orejas-en-armonia"}


@app.get("/health")
def health():
    return {"status": "ok"}
