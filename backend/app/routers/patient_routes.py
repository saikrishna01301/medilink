from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session
from app.schemas import ReadUser
from app.db.crud import patient_crud as crud


router = APIRouter()


# API Endpoints
@router.get("/search-doctors", response_model=list[ReadUser])
async def search_doctors(query: str, session: AsyncSession = Depends(get_session)):
    results = await crud.search_doctors(query, session)
    if not results:
        raise HTTPException(status_code=404, detail="No patients found.")
    return results
