from app.core.config import config
from openai import AsyncOpenAI, OpenAIError
import base64

client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)


# 1. Convert raw bytes to Base64 string
# 2. Construct the Data URL (MANDATORY format: "data:{mime_type};base64,{Base64 string}")
def to_data_url(image_bytes: bytes, mime_type: str) -> str:
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:{mime_type};base64,{b64}"


# Extract text from image using OpenAI's GPT-4o-mini model
async def extract_text_from_image(image_bytes: bytes, mime_type: str) -> str:
    # Convert image bytes to data URL
    data_url = to_data_url(image_bytes, mime_type)

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "Extract ALL visible printed text exactly as-is. Do not summarize.",
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": data_url},
                    }
                ],
            },
        ],
    )
    return response.choices[0].message.content


# Extract handwritten text from image using OpenAI's GPT-4o model
async def extract_handwritten(image_bytes: bytes, mime_type: str) -> str:
    data_url = to_data_url(image_bytes, mime_type)

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": (
                    """You are an expert in reading and transcribing handwritten text from images, especially medical notes and prescriptions.
                        Your task:
                        Extract ONLY the handwritten text written by the doctor or patient in the image.

                        Strict rules:
                        1. Ignore all printed content such as headers, logos, stamps, typed text, and layout lines.
                        2. Extract only handwriting.
                        3. Read unclear handwriting using best logical interpretation, but do NOT invent new medicines or fabricate information.
                        4. If handwriting is too unclear to interpret, return "[unreadable]" for that part.
                        5. Preserve the natural order — top to bottom, left to right.
                        6. Normalize numbers and dates when possible (e.g., convert all non-English digits to English digits).
                        7. Expand common medical abbreviations only when unambiguous (e.g., “Tab.” → “Tablet”, “Cap.” → “Capsule”, “OD” → “once daily”, “BD” → “twice daily”).
                        8. Do NOT provide any medical advice.

                        Output:
                        Return only the extracted handwritten text in clean, readable form. Do not add explanations, summaries, or interpretations.
                        """
                ),
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": data_url},
                    }
                ],
            },
        ],
    )
    return response.choices[0].message.content


# Detect if the image contains handwritten text
async def detect_handwritten(image_bytes: bytes, mime_type: str) -> bool:
    data_url = to_data_url(image_bytes, mime_type)

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "Determine if the text in the provided image is handwritten or printed. Respond with only 'y' or 'n'",
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": data_url},
                    }
                ],
            },
        ],
    )
    answer = response.choices[0].message.content.strip().lower()
    return answer.startswith("y")
