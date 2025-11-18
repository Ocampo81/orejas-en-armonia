# backend/app/routers/testimonials.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from pathlib import Path
from datetime import datetime
import json, secrets

from ..admin_auth import get_admin_from_cookie  # mismo que usas en cases

router = APIRouter(prefix="/testimonials", tags=["testimonials"])

PROJECT_ROOT = Path(__file__).resolve().parents[3]
PUBLIC_DIR   = PROJECT_ROOT / "public" / "testimonials"
REGISTRY     = PROJECT_ROOT / "public" / "testimonials.json"

PUBLIC_DIR.mkdir(parents=True, exist_ok=True)


def load_testimonials() -> list[dict]:
    if REGISTRY.exists():
        return json.loads(REGISTRY.read_text(encoding="utf-8"))
    return []


def save_testimonials(data: list[dict]) -> None:
    REGISTRY.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


@router.get("")
def list_testimonials():
    """Lista pública de testimonios: la usa la landing."""
    return load_testimonials()


async def _save_image_optional(file: UploadFile | None) -> str | None:
    """Guarda la imagen si viene, si no devuelve None."""
    if not file:
        return None
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "El archivo debe ser una imagen")

    ext = Path(file.filename or "").suffix.lower() or ".jpg"
    name = f"{secrets.token_hex(8)}{ext}"
    path = PUBLIC_DIR / name
    content = await file.read()
    path.write_bytes(content)
    return f"/public/testimonials/{name}"


@router.post("", status_code=201, dependencies=[Depends(get_admin_from_cookie)])
async def create_testimonial(
    name: str = Form(...),
    text: str = Form(...),
    role: str = Form("", description="ej: Paciente, Mamá de paciente, etc."),
    photo: UploadFile | None = File(None),
):
    """
    Crear testimonio (solo admin).
    La foto es opcional.
    """
    if not name.strip():
        raise HTTPException(400, "El nombre es obligatorio")
    if not text.strip():
        raise HTTPException(400, "El texto del testimonio es obligatorio")

    photo_url = await _save_image_optional(photo)

    data = load_testimonials()
    next_id = (max((t["id"] for t in data), default=0) + 1)

    new_t = {
        "id": next_id,
        "name": name.strip(),
        "text": text.strip(),
        "role": role.strip(),
        "photo": photo_url,          # puede ser None
        "created_at": datetime.utcnow().isoformat() + "Z",
    }

    data.append(new_t)
    save_testimonials(data)
    return new_t


@router.delete("/{testimonial_id}", status_code=204, dependencies=[Depends(get_admin_from_cookie)])
def delete_testimonial(testimonial_id: int):
    """Eliminar testimonio (solo admin)."""
    data = load_testimonials()
    found = next((t for t in data if t["id"] == testimonial_id), None)
    if not found:
        raise HTTPException(404, "No existe")

    # borrar archivo físico si hay foto
    photo_url = found.get("photo")
    if photo_url:
        fs_path = PROJECT_ROOT / photo_url.lstrip("/")
        if fs_path.exists():
            try:
                fs_path.unlink()
            except:
                pass

    data = [t for t in data if t["id"] != testimonial_id]
    save_testimonials(data)
    return JSONResponse(status_code=204, content=None)
