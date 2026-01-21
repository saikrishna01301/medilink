from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from app.db import get_session
from app.db import auth_crud, assistant_crud
from app.db.crud import doctor_crud, appointment_request_crud
from app.services import auth_utils
from app.core import config
from app.schemas import ChatRequest
import json
from app.services.assistant_tools import ai_register
from app.services.assistant_tools.tool_definitions import tools
from datetime import datetime, date, time


# from app.routers.rag_routes import should_use_rag
from app.services.assistant_rag import indexing
from app.services.auth_utils import decode_token
from app.services.assistant_tools.prompt import build_system_prompt

# hey reminder: this is a chat assistant router
# it handles chat interactions, tool calls, and RAG retrieval


router = APIRouter()
client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)


# Tool function registry
async def execute_tool(tool_call, user_id, session):
    name = tool_call.function.name
    params = json.loads(tool_call.function.arguments or "{}")
    # args_raw = tool_call.function.arguments

    # try:
    #     args_dict = json.loads(args_raw)
    # except json.JSONDecodeError:
    #     return {"error": "Invalid JSON arguments."}
    func = ai_register.tool_registry.get(name)

    if not func:
        return {"error": f"Unknown tool: {name}"}

    if name == "clear_chat":
        return await func(session=session, user_id=user_id)
    if name == "search_doctors":
        return await func(session=session, user_id=user_id, params=params)
    if name == "book_appointment":
        return await func(session=session, user_id=user_id, params=params)
    if name == "appointment_status":
        return await func(session=session, user_id=user_id, params=params)
    if name == "doctor_appointment_requests":
        return await func(session=session, user_id=user_id, params=params)

    # Fallback for other registered tools
    return await func(session=session, user_id=user_id, params=params)


# Tool: book appointment (creates appointment_request)


# Chat endpoint with streaming and tool usage
@router.post("/chat")
async def chat_stream(
    request: ChatRequest,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(auth_utils.decode_token),
):
    question = request.messages[-1].content

    # Always try a RAG lookup; only attach if we actually get context.
    NON_KNOWLEDGE_QUERIES = [
        "hi",
        "hello",
        "hey",
        "thanks",
        "thank you",
        "ok",
        "okay",
        "cool",
        "yes",
        "no",
    ]

    def is_small_talk(text: str) -> bool:
        return len(text.split()) <= 2 or text.lower().strip() in NON_KNOWLEDGE_QUERIES

    use_rag = False

    rag_results = {"context": "", "chunks": []}

    if not is_small_talk(question):
        rag_results = await indexing.query_rag(user_id, question)
        use_rag = bool(rag_results.get("context"))

    citations = rag_results.get("chunks") if use_rag else None
    context_for_gpt = rag_results.get("context", "")

    # get current_user
    # Fetch user by id (current_user expects email)
    user = await auth_crud.get_user_by_id(user_id, session)

    # previous messages
    previous_messages = await assistant_crud.get_recent_messages(
        session, user_id, limit=20
    )

    # convert to OpenAI message format
    past_messages = [{"role": m.role, "content": m.content} for m in previous_messages]

    # System prompt defining the AI assistant's behavior
    prompt_system = build_system_prompt(user, context_for_gpt)

    # messages for AI assistant model
    messages = [
        prompt_system,
        *past_messages,
        *[{"role": m.role, "content": m.content} for m in request.messages],
    ]

    # phase 1 decision
    decision = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        tools=tools,
        stream=False,  # we need full JSON to see tool_calls
    )
    message = decision.choices[0].message
    tool_calls = getattr(message, "tool_calls", None)

    print("decision.content:", decision.choices[0].message.content)
    print(
        "decision.tool_calls:",
        getattr(decision.choices[0].message, "tool_calls", None),
    )

    # phase 2 execute tools

    if tool_calls:
        use_rag = False  # disable RAG when tools are used
        citations = None  # disable citations when tools are used
        tool_call = tool_calls[0]
        tool_name = tool_call.function.name
        tool_result = await execute_tool(tool_call, user_id, session)

        if tool_name == "clear_chat":
            # respond with a simple fixed message
            return {"message": "Chat cleared successfully."}

        # Shortcut: if this is a doctor search, return a structured payload
        if tool_name == "search_doctors":
            payload = {
                "type": "DOCTOR_LIST",
                "doctors": tool_result.get("results", []),
            }
            content_str = json.dumps(payload)

            async def gen_doctors():
                # stream the structured payload once
                yield content_str
                # save chat messages
                await assistant_crud.save_chat(
                    session, user_id, "user", request.messages[-1].content
                )
                await assistant_crud.save_chat(
                    session, user_id, "assistant", content_str
                )

            return StreamingResponse(gen_doctors(), media_type="text/plain")

        # Build messages for follow-up
        followup_messages = messages + [
            {
                "role": "assistant",
                "content": None,
                "tool_calls": [tool_call],
            },
            {
                "role": "tool",
                "name": tool_name,
                "tool_call_id": tool_call.id,
                "content": json.dumps(tool_result),
            },
        ]

    async def gen():
        full_response = ""
        stream = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=followup_messages if tool_calls else messages,
            stream=True,
        )
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                part = chunk.choices[0].delta.content
                full_response += part
                yield part

        # save after streaming
        # save user message
        await assistant_crud.save_chat(
            session, user_id, "user", request.messages[-1].content
        )

        # save assistant response
        await assistant_crud.save_chat(
            session,
            user_id,
            "assistant",
            full_response,
            citations=json.dumps(citations) if use_rag else None,
        )

    return StreamingResponse(gen(), media_type="text/plain")


# fetch previous chats
@router.get("/history")
async def chat_history(
    session: AsyncSession = Depends(get_session), user_id=Depends(decode_token)
):
    previous_chat = await assistant_crud.get_recent_messages(session, user_id, limit=20)

    if not previous_chat:
        return None

    return [
        {
            "role": m.role,
            "content": m.content,
            "timestamp": m.timestamp.isoformat(),
            "citations": json.loads(m.citations) if m.citations else None,
        }
        for m in previous_chat
    ]


@router.get("/last-message")
async def get_last_message(
    session: AsyncSession = Depends(get_session), user_id: int = Depends(decode_token)
):
    message = await assistant_crud.get_last_message(session, user_id)
    if not message:
        return None

    return {
        "role": message.role,
        "content": message.content,
        "citations": json.loads(message.citations) if message.citations else None,
    }
