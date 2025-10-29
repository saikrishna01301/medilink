from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import User, DBSession, OTPStore


async def search_patients(query: str, session: AsyncSession):
    query = query.strip().lower()
    query_no_space = query.replace(" ", "")

    stmt = (
        select(User)
        .where(
            User.role == "patient",
            or_(
                func.lower(User.first_name).ilike(f"%{query}%"),
                func.lower(User.last_name).ilike(f"%{query}%"),
                func.lower(func.concat(User.first_name, " ", User.last_name)).ilike(
                    f"%{query}%"
                ),
                func.lower(func.concat(User.first_name, User.last_name)).ilike(
                    f"%{query_no_space}%"
                ),
            ),
        )
        .limit(20)
    )

    result = await session.execute(stmt)
    return result.scalars().all()
