# backend/app/admin_auth.py
import os
import time

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from passlib.hash import argon2

router = APIRouter(prefix="/admin", tags=["admin-auth"])

# === Configuración básica ===

ADMIN_USER = os.getenv("ADMIN_USER", "admin")
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH")
SECRET_KEY = os.getenv("ADMIN_SECRET_KEY", "CHANGE_ME_SUPER_SECRET")

if not ADMIN_PASSWORD_HASH:
    raise RuntimeError("Falta ADMIN_PASSWORD_HASH en las variables de entorno")

SESSION_COOKIE = "admin_session"
SESSION_MAX_AGE = 60 * 60 * 8  # 8 horas

serializer = URLSafeTimedSerializer(SECRET_KEY, salt="admin-session")


def verify_password(plain: str, hashed: str) -> bool:
    # Verificamos usando argon2 (mismo algoritmo que usamos para generar el hash)
    return argon2.verify(plain, hashed)


def create_session_token(sub: str = "admin") -> str:
    return serializer.dumps({"sub": sub, "iat": int(time.time())})


def decode_session_token(token: str):
    return serializer.loads(token, max_age=SESSION_MAX_AGE)


def get_admin_from_cookie(request: Request):
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado",
        )

    try:
        data = decode_session_token(token)
    except SignatureExpired:
        raise HTTPException(status_code=401, detail="Sesión expirada")
    except BadSignature:
        raise HTTPException(status_code=401, detail="Token inválido")

    if data.get("sub") != "admin":
        raise HTTPException(status_code=401, detail="No autorizado")

    return "admin"


@router.post("/login")
async def admin_login(payload: dict, response: Response):
    """
    Body esperado:
    {
      "username": "admin",
      "password": "...."
    }
    """
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""

    if username != ADMIN_USER or not verify_password(password, ADMIN_PASSWORD_HASH):
        # no damos pistas de si fue user o pass
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    token = create_session_token("admin")

    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        httponly=True,
        secure=False,  # en producción con HTTPS: True
        samesite="lax",
        max_age=SESSION_MAX_AGE,
        path="/",
    )

    return {"ok": True}


@router.post("/logout")
async def admin_logout(response: Response):
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"ok": True}


@router.get("/me")
async def admin_me(user=Depends(get_admin_from_cookie)):
    return {"ok": True, "user": user}
