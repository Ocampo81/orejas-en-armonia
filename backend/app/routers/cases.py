# backend/app/routers/cases.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from pathlib import Path
import json, secrets

router = APIRouter(prefix="/cases", tags=["cases"])

# ── rutas en la RAÍZ del repo, no dentro de backend/ ─────────────
# .../orejas-en-armonia/backend/app/routers/cases.py
# parents[3] => .../orejas-en-armonia
PROJECT_ROOT = Path(__file__).resolve().parents[3]
PUBLIC_DIR   = PROJECT_ROOT / "public" / "antes-despues"
REGISTRY     = PROJECT_ROOT / "public" / "cases.json"

PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

def load_cases() -> list[dict]:
    if REGISTRY.exists():
        return json.loads(REGISTRY.read_text(encoding="utf-8"))
    return []

def save_cases(data: list[dict]) -> None:
    REGISTRY.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

@router.get("")
def list_cases():
    return load_cases()

@router.post("", status_code=201)
async def upload_case(
    before: UploadFile = File(...),
    after:  UploadFile = File(...),
    label:  str       = Form("")
):
    # Validar que sean imágenes
    if not before.content_type.startswith("image/") or not after.content_type.startswith("image/"):
        raise HTTPException(400, "Los archivos deben ser imágenes")

    async def save_one(f: UploadFile) -> str:
        ext = Path(f.filename or "").suffix.lower() or ".jpg"
        name = f"{secrets.token_hex(8)}{ext}"
        path = PUBLIC_DIR / name
        content = await f.read()
        path.write_bytes(content)
        # URL que usará el FRONT
        return f"/public/antes-despues/{name}"

    before_url = await save_one(before)
    after_url  = await save_one(after)

    cases = load_cases()
    next_id = (max((c["id"] for c in cases), default=0) + 1)
    new_case = {
        "id": next_id,
        "before": before_url,
        "after": after_url,
        "label": label.strip() or f"Paciente {next_id}",
    }
    cases.append(new_case)
    save_cases(cases)
    return new_case

@router.delete("/{case_id}", status_code=204)
def delete_case(case_id: int):
    cases = load_cases()
    found = next((c for c in cases if c["id"] == case_id), None)
    if not found:
        raise HTTPException(404, "No existe")

    # borrar archivos físicos
    for key in ("before", "after"):
        url = found[key]                      # p.ej. /public/antes-despues/abc.jpg
        fs_path = PROJECT_ROOT / url.lstrip("/")  # …/orejas-en-armonia/public/antes-despues/abc.jpg
        if fs_path.exists():
            try:
                fs_path.unlink()
            except:
                pass

    # actualizar registry
    cases = [c for c in cases if c["id"] != case_id]
    save_cases(cases)
    return JSONResponse(status_code=204, content=None)
