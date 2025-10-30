from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session
from app.db.crud import doctor_crud as crud
from app.schemas import ReadUser

router = APIRouter()


# API Endpoints
@router.get("/search-patients", response_model=list[ReadUser])
async def search_patients(query: str, session: AsyncSession = Depends(get_session)):
    results = await crud.search_patients(query, session)
    if not results:
        raise HTTPException(status_code=404, detail="No patients found.")
    return results
