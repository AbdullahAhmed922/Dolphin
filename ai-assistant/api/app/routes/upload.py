import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse

from app.core.config import Settings, get_settings
from app.documents import (
    ALL_ALLOWED,
    MAX_DOCUMENT_BYTES,
    DocumentError,
    allowed_extension,
    extract_document,
)

router = APIRouter()

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def _save_file(upload_path: Path, filename: str, content: bytes) -> None:
    upload_path.mkdir(parents=True, exist_ok=True)
    file_path = upload_path / filename
    with open(file_path, "wb") as f:
        f.write(content)


@router.post("/upload")
async def upload_image(
    file: UploadFile,
    settings: Annotated[Settings, Depends(get_settings)],
):
    # Validate extension
    extension = Path(file.filename or "").suffix.lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file extension. Allowed: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}",
        )

    filename = f"{uuid.uuid4()}{extension}"
    upload_path = Path(settings.upload_dir)

    try:
        content = await file.read()
        await run_in_threadpool(_save_file, upload_path, filename, content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {e!s}") from e

    return JSONResponse(
        {
            "image_url": f"/api/uploads/{filename}",
            "filename": filename,
        }
    )


@router.post("/upload/document")
async def upload_document(file: UploadFile):
    """Upload a document and extract its text content.

    Supports PDF, plain text, and common code files. Returns the
    extracted text ready to be injected into a chat message.
    """
    original_name = file.filename or "document"
    extension = Path(original_name).suffix.lower()

    if not allowed_extension(original_name):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type '{extension}'. "
                f"Allowed extensions: {', '.join(sorted(ALL_ALLOWED))}"
            ),
        )

    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not read file: {e!s}") from e

    if len(content) > MAX_DOCUMENT_BYTES:
        limit_mb = MAX_DOCUMENT_BYTES / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"File is too large ({len(content) / (1024 * 1024):.1f} MB). Limit: {limit_mb:g} MB.",
        )

    try:
        extracted = await run_in_threadpool(extract_document, content, original_name)
    except DocumentError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not process file: {e!s}") from e

    return JSONResponse(
        {
            "filename": original_name,
            "extension": extension,
            "size": len(content),
            "text": extracted,
            "char_count": len(extracted),
        }
    )
