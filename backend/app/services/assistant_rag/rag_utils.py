import io
import pdfplumber
import re
import os, json
from openai import AsyncOpenAI
from app.core import config

client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)


# Split PDF pages into sections using LLM
async def split_into_sections(pages: list[str]):
    prompt = """You are a medical document segmenter.
            Task:
            Split the given PDF pages into logical LAB SECTIONS.

            CRITICAL INSTRUCTIONS:
            - Do NOT summarize, rewrite, normalize, or paraphrase any text.
            - Do NOT invent or guess missing content.
            - You MUST return text that is copied EXACTLY from the original pages.
            - Preserve original line breaks, spacing, punctuation, and capitalization.
            - Do NOT clean the text.
            - Do NOT remove headers, footers, reference ranges, or notes.
            - Your job is ONLY to group text, not interpret it.

            SECTION RULES:
            Each section should represent a logical group of related lab content such as:
            - A specific lab panel (e.g., CBC, Lipid Panel)
            - A group of tests listed together
            - A report section (e.g., “Chemistry”, “Hematology”)
            - A results block with values and reference ranges

            For each section return this exact JSON structure:
            {
            "sections": [
                {
                "section_name": string,
                "page_start": number,
                "page_end": number,
                "text": string
                }
            ]
            }

            OUTPUT RULES:
            - Return ONLY valid JSON.
            - No explanations.
            - No comments.
            - No markdown.
            - No extra text outside JSON.
        """

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": "\n\n---PAGE---\n".join(pages)},
        ],
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)["sections"]


# extract structured data from text
async def extract_structured_data(text: str) -> dict:
    response = await client.chat.completions.create(
        model="gpt-4o",  # high accuracy needed
        messages=[
            {
                "role": "system",
                "content": (
                    "Extract ALL laboratory test values from the text."
                    "The text may include: tables, vertical labels, multi-line entries, or messy OCR."
                    "Be tolerant of different formats."
                    "Normalize all values into simple number + unit."
                    "Detect reference ranges when possible."
                    "Return ONLY JSON in this format:\n"
                    "{"
                    "  tests: ["
                    "    {"
                    "      name: string,"
                    "      value: number | string,"
                    "      unit: string | null,"
                    "      reference_range: string | null,"
                    "      date: string | null"
                    "    }"
                    "  ]"
                    "}"
                ),
            },
            {"role": "user", "content": text},
        ],
        response_format={"type": "json_object"},  # forces JSON mode
    )

    return json.loads(response.choices[0].message.content)


# Extract dates from text
def extract_dates(text: str):
    patterns = [
        r"\d{4}-\d{2}-\d{2}",  # 2024-04-03
        r"\d{2}/\d{2}/\d{4}",  # 03/04/2024
        r"\d{2}-\d{2}-\d{4}",  # 03-04-2024
        r"\b[A-Za-z]+\s\d{1,2},\s\d{4}",  # April 3, 2024
        r"\b\d{1,2}/\d{1,2}/\d{4}\b",  # 3/4/2024
    ]

    dates = []
    for p in patterns:
        dates.extend(re.findall(p, text))

    return dates if dates else None


# Split text into chunks with overlap
def split_text(text: str, chunk_size: int = 100, overlap: int = 50):
    words = text.split()
    chunks = []
    start = 0

    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


# extract tests from a chunk based on structured doc
def extract_tests_for_chunk(chunk_text: str, structured_doc: dict):
    tests = []
    if not structured_doc or "tests" not in structured_doc:
        return tests

    for t in structured_doc["tests"]:
        name = t["name"].lower()
        if name in chunk_text.lower():
            tests.append(t)

    return tests


# extract text page by page list[str]
def extract_text_from_pdf(pdf_bytes):
    pages = []
    # io.BytesIO treats raw bytes as a file-like object.. creates in-memory object around it
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            pages.append(page.extract_text() or "")
    return pages
