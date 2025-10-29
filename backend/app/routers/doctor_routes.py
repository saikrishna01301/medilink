from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session
from app.db.crud import doctor_crud as crud

router = APIRouter()


# API Endpoints
@router.get("/search-patients")
async def search_patients(query: str, session: AsyncSession = Depends(get_session)):
    results = await crud.search_patients(query, session)
    if not results:
        raise HTTPException(status_code=404, detail="No patients found.")
    return results
