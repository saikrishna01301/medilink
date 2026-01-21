from app.core import config
from openai import AsyncOpenAI
import numpy as np
import faiss
import os, json
from datetime import datetime
from app.services.assistant_rag import rag_utils


client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)
dimensions = 1536  # Dimension for text-embedding-3-small
DATA_ROOT = "data/users"


# Generate embedding for a text chunk
async def generate_embed(text_chunk: str):
    embedding = await client.embeddings.create(
        model="text-embedding-3-small", input=text_chunk
    )
    return np.array(embedding.data[0].embedding, dtype="float32")


# Load or initialize user index and chunks
def load_user_index(user_id: str):
    user_dir = os.path.join(DATA_ROOT, str(user_id))
    os.makedirs(user_dir, exist_ok=True)

    index_path = os.path.join(user_dir, "kb.faiss")
    chunks_path = os.path.join(user_dir, "chunks.json")
    files_path = os.path.join(user_dir, "files.json")

    if os.path.exists(index_path):
        index = faiss.read_index(index_path)
    else:
        index = faiss.IndexFlatL2(dimensions)

    if os.path.exists(chunks_path):
        with open(chunks_path) as f:
            stored_chunks = json.load(f)
    else:
        stored_chunks = []

    if os.path.exists(files_path):
        with open(files_path) as f:
            stored_files = json.load(f)
    else:
        stored_files = []

    return index, stored_chunks, user_dir, stored_files


# Save user index and chunks and files
def save_user_index(index, stored_chunks, user_dir, stored_files):
    faiss.write_index(index, os.path.join(user_dir, "kb.faiss"))
    with open(os.path.join(user_dir, "chunks.json"), "w") as f:
        json.dump(stored_chunks, f)
    with open(os.path.join(user_dir, "files.json"), "w") as f:
        json.dump(stored_files, f)


# Store document for a user
async def store_document(user_id: int, text: str, metadata: dict = None):
    index, stored_chunks, user_dir, stored_files = load_user_index(user_id)
    chunks = rag_utils.split_text(text)
    vectors = []

    file_id = metadata["file_id"]

    # Check if file already exists
    existing_file = next((f for f in stored_files if f["file_id"] == file_id), None)

    if not existing_file:
        file_data = {
            "file_id": file_id,
            "file_name": metadata.get("file_name"),
            "file_type": metadata.get("file_type"),
            "uploaded_at": datetime.utcnow().isoformat(),
            "structured": metadata.get("structured"),
            "dates": metadata.get("dates"),
            "num_chunks": 0,
        }
        stored_files.append(file_data)
    else:
        file_data = existing_file

    for i, chunk in enumerate(chunks):
        vec = await generate_embed(chunk)
        vectors.append(vec)

        chunk_id = f"{file_id}_c{len(stored_chunks)}"
        chunk_obj = {
            "text": chunk,
            "file_id": file_data.get("file_id"),
            "file_name": file_data.get("file_name"),
            "chunk_id": chunk_id,
            "source_id": f"{file_data.get('file_id')}_c{i}",
            "page_start": metadata.get("page_start"),
            "page_end": metadata.get("page_end"),
        }

        stored_chunks.append(chunk_obj)

    vectors = np.array(vectors, dtype="float32")
    index.add(vectors)

    file_data["num_chunks"] += len(chunks)

    save_user_index(index, stored_chunks, user_dir, stored_files)


# Query RAG for a user
async def query_rag(user_id: int, question: str):
    print("Querying RAG for user:", user_id, "Question:", question)
    index, stored_chunks, _, stored_files = load_user_index(user_id)
    if not stored_chunks:
        return {"context": "", "chunks": [], "structured": None}

    # STEP 1 — Gather structured tests
    structured_tests = []

    for file in stored_files:
        structured = file.get("structured")
        if structured and "tests" in structured:
            structured_tests.extend(structured["tests"])

    # STEP 2 — Attempt structured match

    q = question.lower()
    matched_test = None

    # in future add validation for tests =[]
    for test in structured_tests:
        if test["name"].lower() in q:
            matched_test = test
            break

    if matched_test:
        return {
            "context": json.dumps(matched_test),  # pass JSON as context
            "chunks": [],
            "structured": matched_test,
        }

    q_vec = await generate_embed(question)
    q_vec = np.array([q_vec], dtype="float32")

    distances, ids = index.search(q_vec, k=3)

    # filter based on distance threshold
    pairs = list(zip(ids[0], distances[0]))
    pairs.sort(key=lambda x: x[1])  # sort by distance (lower = closer)

    # keep close matches; if none pass the threshold, fall back to the closest hits
    filtered = [i for i, dist in pairs if dist < 1.2]
    if not filtered:
        filtered = [i for i, _ in pairs if i != -1]
    if not filtered:
        return {"context": "", "chunks": [], "structured": None}

    top_chunks = filtered[:3]
    print("Top chunk IDs:", top_chunks)

    retrieved = [stored_chunks[i] for i in top_chunks]
    print("Retrieved Chunks:", retrieved)
    # [{"text": stored_chunks[i], "source_id": f"doc_{i}"}]

    # combine retrieved text into single string
    context = "\n---\n".join(r["text"] for r in retrieved)

    return {"context": context, "chunks": retrieved, "structured": None}
