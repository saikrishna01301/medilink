from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db import User, DBSession, OTPStore
from datetime import datetime, timezone


async def check_user_exists(email: str, phone: str, session: AsyncSession):
    """Check if a user with the given email or phone already exists"""
    existing_user = await session.scalar(
        select(User).where(
            (User.email == email) | (User.phone == phone)
        )
    )
    return existing_user


async def create_user(user_data_dict, hashed, session: AsyncSession):
    db_user = User(**user_data_dict, password_hash=hashed)
    session.add(db_user)

    await session.commit()
    await session.refresh(db_user)
    return db_user


async def login_user(user, session: AsyncSession):
    validate_user = await session.scalar(
        select(User).where(
            (User.email == user.email_or_phone) | (User.phone == user.email_or_phone)
        )
    )
    return validate_user


async def create_session(
    user_id: int, refresh_token_hash, refresh_exp, session: AsyncSession
):
    naive_refresh_exp = refresh_exp.replace(tzinfo=None)
    user_session = DBSession(
        user_id=user_id,
        refresh_token_hash=refresh_token_hash,
        expires_at=naive_refresh_exp,
    )
    session.add(user_session)
    await session.commit()
    await session.refresh(user_session)


async def store_otp(
    id: int, otp_code: str, otp_expires: datetime, email: str, session: AsyncSession
):
    otp_data = OTPStore(
        user_id=id, identifier=email, otp_code=otp_code, expires_at=otp_expires
    )
    session.add(otp_data)
    await session.commit()
    await session.refresh(otp_data)


# ------------------------------------------------
async def verify_otp(
    user_id: int,
    identifier: str,
    otp_code: str,
    session: AsyncSession,
):
    otp_record = await session.scalar(
        select(OTPStore).where(
            (OTPStore.user_id == user_id)
            & (OTPStore.identifier == identifier)
            & (OTPStore.otp_code == otp_code)
        )
    )
    naive_utc_now = datetime.now(timezone.utc).replace(tzinfo=None)

    if otp_record and otp_record.expires_at > naive_utc_now:
        # Successful verification: delete the record and return the object

        # 3. Delete record immediately upon successful verification
        try:
            await session.delete(otp_record)
            await session.commit()
            return otp_record
        except Exception:
            # Handle case where commit fails but verification was valid
            return otp_record

    # If invalid or expired, delete and return None
    if otp_record:
        await session.delete(otp_record)
        await session.commit()

    return None


async def current_user(email: str, session: AsyncSession):
    user = await session.scalar(select(User).where(User.email == email))
    return user


async def get_user_by_id(user_id: int, session: AsyncSession):
    user = await session.scalar(select(User).where(User.id == user_id))
    return user


async def active_sessions(hashed_incoming_token, session: AsyncSession):
    sessions = await session.execute(
        select(DBSession).where(DBSession.refresh_token_hash == hashed_incoming_token)
    )

    return sessions.all()


async def delete_session(db_session: DBSession, session: AsyncSession):
    await session.delete(db_session)
    await session.commit()


# async def change_password(user_id: int, new_hashed_password: str, session: AsyncSession):
#     user = await session.get(User, user_id)
#     if user:
#         user.password_hash = new_hashed_password
#         session.add(user)
#         await session.commit()
#         await session.refresh(user)
#         return user
#     return None
