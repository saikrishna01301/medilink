from typing import Set
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session, auth_crud
from fastapi import Depends
from app.db.crud.assistant_rag_crud import (
    fetch_patient_accessible_files,
    fetch_doctor_accessible_files,
)
from app.services.assistant_rag.rag_gcs_reader import (
    read_file_from_gcs_url,
    extract_text_from_file,
)

# this is where load_user_index / store_document live
# structured extraction, date extraction
from app.services.assistant_rag import indexing, rag_utils
from app.db import auth_crud


# async def prepare_user_kb(user_id: int, session: AsyncSession = Depends(get_session)):
#     user = await auth_crud.get_user_by_id(user_id, session)

#     if user.role == "patient":
#         files = await fetch_patient_accessible_files(session, user_id)
#     elif user.role == "doctor":
#         files = await fetch_doctor_accessible_files(session, user_id)
#     else:
#         files = []

#     # Step 2: Load existing user index to avoid re-indexing
#     index, stored_chunks, user_dir, stored_files = indexing.load_user_index(user_id)

#     # Create a set of already indexed file IDs for quick lookup
#     indexed_file_ids: Set[int] = {f["file_id"] for f in stored_files}

#     # Step 3: Process each file and index only missing/new files
#     for f in files:
#         file_id = f["file_id"]

#         if file_id in indexed_file_ids:
#             continue

#         file_url = f["file_url"]
#         file_type = f["file_type"].lower()
#         file_name = f["file_name"]

#         # 3a) Download file from GCS
#         try:
#             file_bytes = await read_file_from_gcs_url(file_url)
#         except Exception as e:
#             # you may want to log this
#             print(f"[RAG prepare] Failed to download file {file_id}: {e}")
#             continue

#         # 3b) Extract text
#         try:
#             text = await extract_text_from_file(file_bytes, file_type)
#         except Exception as e:
#             print(f"[RAG prepare] Failed to extract text from file {file_id}: {e}")
#             continue

#         if not text.strip():
#             continue

#         # Extract structured data from the entire document
#         structured = await rag_utils.extract_structured_data(text)
#         # Extract dates
#         doc_dates = rag_utils.extract_dates(text)
#         if structured and "tests" in structured:
#             for test in structured["tests"]:
#                 test["date"] = doc_dates[0] if doc_dates else None

#         if file_type == "pdf":
#             # For PDFs: split into sections (uses raw page list) and index each section
#             pages = rag_utils.extract_text_from_pdf(file_bytes)
#             sections = await rag_utils.split_into_sections(pages)

#             for section in sections:
#                 section_text = section["text"]
#                 metadata = {
#                     "file_id": file_id,
#                     "file_name": file_name,
#                     "file_type": "pdf",
#                     "section_name": section["section_name"],
#                     "page_start": section["page_start"],
#                     "page_end": section["page_end"],
#                     "structured": structured,
#                     "dates": doc_dates,  # list of dates found in document for future use
#                 }
#                 await indexing.store_document(
#                     user_id,
#                     section_text,
#                     metadata=metadata,
#                 )
#         else:
#             # For non-PDFs (e.g., images): store full text once without section splitting
#             metadata = {
#                 "file_id": file_id,
#                 "file_name": file_name,
#                 "file_type": file_type,
#                 "structured": structured,
#                 "dates": doc_dates,
#             }
#             await indexing.store_document(
#                 user_id,
#                 text,
#                 metadata=metadata,
#             )
#     return


async def prepare_user_kb(user_id: int, session: AsyncSession = Depends(get_session)):
    print("Preparing KB for user:", user_id)

    # Fetch user and accessible files. If role not set, treat as patient for now.
    user = await auth_crud.get_user_by_id(user_id, session)
    print("User role:", user.role)

    role = (user.role or "").lower() if hasattr(user, "role") else ""
    if role == "doctor":
        files = await fetch_doctor_accessible_files(session, user_id)
    elif role in ("patient", ""):
        # treat null/empty role as patient
        files = await fetch_patient_accessible_files(session, user_id)
    else:
        # no accessible files for other roles yet
        files = []

    print("FILES FOUND:", len(files))

    # Load existing FAISS index
    index, stored_chunks, user_dir, stored_files = indexing.load_user_index(user_id)
    indexed_file_ids: Set[int] = {f["file_id"] for f in stored_files}

    print("Already indexed:", indexed_file_ids)

    for f in files:
        file_id = f["file_id"]

        if file_id in indexed_file_ids:
            print("Skipping already indexed file:", file_id)
            continue

        file_url = f["file_url"]

        # Normalize file type
        raw_type = f["file_type"].lower()
        file_type = raw_type.split("/")[-1]  # "application/pdf" -> "pdf"
        file_name = f["file_name"]

        print(f"Downloading: {file_name} ({file_type})")

        try:
            file_bytes = await read_file_from_gcs_url(file_url)
            print("Downloaded bytes:", len(file_bytes))
        except Exception as e:
            print("Download error:", e)
            continue

        try:
            text = await extract_text_from_file(file_bytes, file_type)
            print("Extracted text length:", len(text))
        except Exception as e:
            print("Extraction error:", e)
            continue

        if not text.strip():
            print("File had NO extractable text")
            continue

        # Structured extraction
        structured = await rag_utils.extract_structured_data(text)
        doc_dates = rag_utils.extract_dates(text)

        # Add dates to tests
        if structured and "tests" in structured:
            for test in structured["tests"]:
                test["date"] = doc_dates[0] if doc_dates else None

        # PDF?
        if file_type == "pdf":
            pages = rag_utils.extract_text_from_pdf(file_bytes)
            sections = await rag_utils.split_into_sections(pages)

            for section in sections:
                metadata = {
                    "file_id": file_id,
                    "file_name": file_name,
                    "file_type": "pdf",
                    "section_name": section["section_name"],
                    "page_start": section["page_start"],
                    "page_end": section["page_end"],
                    "structured": structured,
                    "dates": doc_dates,
                }

                print("Indexing section:", section["section_name"])
                await indexing.store_document(user_id, section["text"], metadata)

        else:
            metadata = {
                "file_id": file_id,
                "file_name": file_name,
                "file_type": file_type,
                "structured": structured,
                "dates": doc_dates,
            }

            print("Indexing non-pdf")
            await indexing.store_document(user_id, text, metadata)

        # Check FAISS size after each file
        index, stored_chunks, _, _ = indexing.load_user_index(user_id)
        print("FAISS now has vectors:", index.ntotal)

    print("KB DONE for user:", user_id)
