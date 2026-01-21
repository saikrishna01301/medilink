from app.services.storage_service import get_storage_service
from app.services.assistant_rag import rag_utils, ocr


async def extract_text_from_file(file_bytes: bytes, file_type: str):
    """
    Convert a file (bytes) to text depending on its type.
    """
    file_type = file_type.lower()

    if file_type == "pdf":
        pages = rag_utils.extract_text_from_pdf(file_bytes)
        return "\n".join(pages)

    if file_type in ["png", "jpg", "jpeg"]:
        detected = await ocr.detect_handwritten(file_bytes, f"image/{file_type}")
        if detected:
            return await ocr.extract_handwritten(file_bytes, f"image/{file_type}")
        else:
            return await ocr.extract_text_from_image(file_bytes, f"image/{file_type}")

    if file_type == "txt":
        return file_bytes.decode("utf-8", errors="ignore")

    raise ValueError(f"Unsupported file type: {file_type}")


async def read_file_from_gcs_url(url: str) -> bytes:
    """
    Given a GCS public URL (stored in DB),
    fetch the file bytes using StorageService.
    """

    storage = get_storage_service()

    # Convert URL -> internal bucket object path
    file_path = storage.extract_file_path_from_url(url)

    if not file_path:
        raise ValueError(f"Invalid GCS URL: {url}")

    # Download securely from GCS
    return await storage.download_file(file_path)
