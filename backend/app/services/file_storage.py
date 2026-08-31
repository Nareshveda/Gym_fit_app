"""Local-disk storage for uploaded files (equipment documents, profile
avatars, etc.). Files are saved under `settings.UPLOAD_DIR` and served back
out via a `StaticFiles` mount at `/uploads` (see `app/main.py`).
"""

from __future__ import annotations

import logging
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.config import settings
from app.exceptions import ValidationError

logger = logging.getLogger(__name__)

# Extension -> content-type(s) it's allowed to arrive as. Checking both the
# filename extension and the browser-reported content type is stricter than
# either alone, without needing to sniff file bytes for this MVP.
DOCUMENT_TYPES: dict[str, set[str]] = {
    ".jpg": {"image/jpeg"},
    ".jpeg": {"image/jpeg"},
    ".pdf": {"application/pdf"},
    ".doc": {"application/msword"},
    ".docx": {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    },
}
IMAGE_TYPES: dict[str, set[str]] = {
    ".jpg": {"image/jpeg"},
    ".jpeg": {"image/jpeg"},
    ".png": {"image/png"},
}
_MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB


async def save_upload(
    upload_file: UploadFile,
    subdir: str,
    allowed_types: dict[str, set[str]] = DOCUMENT_TYPES,
) -> tuple[str, str]:
    """Validate and persist an uploaded file to local disk.

    Raises `ValidationError` if the file's extension/content-type isn't in
    `allowed_types` (defaults to `DOCUMENT_TYPES`; pass `IMAGE_TYPES` for
    profile pictures), or it exceeds 10 MB.

    Returns:
        `(stored_filename, url_path)` — `url_path` is the path clients fetch
        the file back from (e.g. `/uploads/equipment/<uuid>.pdf`).
    """
    original_name = upload_file.filename or ""
    extension = Path(original_name).suffix.lower()
    allowed_content_types = allowed_types.get(extension)
    if allowed_content_types is None:
        allowed_list = ", ".join(sorted(allowed_types))
        raise ValidationError(f"Unsupported file type. Allowed: {allowed_list}")
    if upload_file.content_type not in allowed_content_types:
        raise ValidationError(
            f"File content does not match its .{extension.lstrip('.')} extension"
        )

    contents = await upload_file.read()
    if len(contents) > _MAX_UPLOAD_BYTES:
        raise ValidationError("File is too large — the limit is 10 MB")

    stored_filename = f"{uuid.uuid4().hex}{extension}"
    target_dir = Path(settings.UPLOAD_DIR) / subdir
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / stored_filename
    target_path.write_bytes(contents)

    logger.info(
        "Stored upload: original=%r stored=%s size=%d",
        original_name,
        stored_filename,
        len(contents),
    )
    return stored_filename, f"/uploads/{subdir}/{stored_filename}"
