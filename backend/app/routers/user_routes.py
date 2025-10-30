from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session

router = APIRouter()

# @router.get("/user/details")
# async def get_user_details(session: AsyncSession = Depends(get_session)):
