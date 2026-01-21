from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from openai import AsyncOpenAI
from app.core import config
from app.services.assistant_rag import rag_utils, indexing, prepare_kb, ocr
from app.services.auth_utils import decode_token

import uuid
from app.db import sessionLocal
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio
from app.services.assistant_rag import ocr

router = APIRouter()
client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)


# run knowledge base preparation in background
async def _background_prepare_kb(user_id: int):
    """
    Background job: open its own DB session and run RAG preparation.
    """
    async with sessionLocal() as session:  # new AsyncSession, independent of request
        await prepare_kb.prepare_user_kb(user_id, session)


# route to trigger knowledge base preparation
@router.post("/prepare_kb")
async def prepare_knowledge_base(
    user_id: int = Depends(decode_token),
):
    asyncio.create_task(_background_prepare_kb(user_id))
    return {"detail": "Knowledge base preparation started in background"}


# should I use the rag or not?
async def should_use_rag(question: str) -> bool:
    prompt = [
        {
            "role": "system",
            "content": "Decide if this question requires accessing documents. Respond with only 'yes' or 'no'.",
        },
        {"role": "user", "content": question},
    ]
    response = await client.chat.completions.create(
        model="gpt-4o-mini", messages=prompt
    )
    answer = response.choices[0].message.content.strip().lower()
    return answer.startswith("y")


# file uploading route
@router.post("/upload")
async def upload_document(
    user_id: int,
    file: UploadFile = File(...),
):
    # file validation
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    # Read file bytes
    pdf_bytes = await file.read()
    pages = rag_utils.extract_text_from_pdf(pdf_bytes)
    text = "\n".join(pages)

    # Generate a unique file ID
    file_id = str(uuid.uuid4())

    # Extract structured data from the entire document
    structured = await rag_utils.extract_structured_data(text)
    # Extract dates
    doc_dates = rag_utils.extract_dates(text)
    if structured and "tests" in structured:
        for test in structured["tests"]:
            test["date"] = doc_dates[0] if doc_dates else None

    # Split into meaningful sections using LLM
    sections = await rag_utils.split_into_sections(pages)

    # Process each section individually and store it with metadata. This allows finer retrieval later.
    for section in sections:
        section_text = section["text"]

        metadata = {
            "file_id": file_id,
            "file_name": file.filename,
            "file_type": "pdf",  # could be extended later
            "section_name": section["section_name"],
            "page_start": section["page_start"],
            "page_end": section["page_end"],
            "structured": structured,
            "dates": doc_dates,  ## list of dates found in document for future use
        }
        await indexing.store_document(
            user_id,
            section_text,
            metadata=metadata,
        )


# upload image router with OCR
@router.post("/upload_image")
async def upload_image(user_id: int, file: UploadFile = File(...)):
    # validate type
    if not file.filename.lower().endswith((".png", ".jpg", ".jpeg")):
        raise HTTPException(status_code=400, detail="Only PNG/JPG images allowed")

    image_bytes = await file.read()
    mime_type = file.content_type  # e.g., "image/jpeg" or "image/png"

    detect_handwritten = await ocr.detect_handwritten(image_bytes, mime_type)
    if detect_handwritten:
        text = await ocr.extract_handwritten(image_bytes, mime_type)
    else:
        text = await ocr.extract_text_from_image(image_bytes, mime_type)

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from image")

    # Generate a unique file ID
    file_id = str(uuid.uuid4())

    # Extract structured data
    structured = await rag_utils.extract_structured_data(text)
    doc_dates = rag_utils.extract_dates(text)

    if structured and "tests" in structured:
        for test in structured["tests"]:
            test["date"] = doc_dates[0] if doc_dates else None

    metadata = {
        "file_id": file_id,
        "file_name": file.filename,
        "file_type": "image",
        "structured": structured,
        "dates": doc_dates,
    }

    await indexing.store_document(
        user_id,
        text,
        metadata=metadata,
    )


@router.post("/query")
async def question_rag(user_id: int, question: str):
    result = await indexing.query_rag(user_id, question)
    return result
