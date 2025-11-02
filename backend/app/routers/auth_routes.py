from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from db import get_session
from db.crud import auth_crud as crud
from schemas import CreateUser, UserLogin, ReadUser, OTPVerification
from services import create_tokens, hash_password, verify_password, verify_access_token
from datetime import datetime
import json

router = APIRouter()


# Health check endpoint
@router.get("/health")
async def health_check():
    """Health check endpoint for container orchestration."""
    return {"status": "healthy", "service": "medilink-backend"}


# Dependency to get current user from access token
async def get_current_user(
    access_token: str = Cookie(None), session: AsyncSession = Depends(get_session)
):
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    payload = await verify_access_token(access_token)
    user_id = int(payload.get("sub"))

    user = await crud.get_user_by_id(user_id, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return user


# API Endpoints
@router.post("/signup", response_model=ReadUser)
async def create_user(user: CreateUser, session: AsyncSession = Depends(get_session)):
    hashed = await hash_password(user.password)
    user_data_dict = user.model_dump(exclude={"password"})
    return await crud.create_user(user_data_dict, hashed, session)


@router.post("/login")
async def user_login(
    user: UserLogin, response: Response, session: AsyncSession = Depends(get_session)
):
    # verify user credentials
    validated_user = await crud.login_user(user, session)
    if not validated_user or not await verify_password(
        user.password, validated_user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    # 2FA DISABLED: Create tokens directly after password verification
    # create tokens
    access_token, refresh_token, refresh_exp = await create_tokens(
        validated_user.id, validated_user.role
    )
    # hash refresh_token
    hashed_refresh_token = await hash_password(refresh_token)
    # store session in db
    await crud.create_session(
        validated_user.id, hashed_refresh_token, refresh_exp, session
    )

    # Access Token (short-lived)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="Lax",
        max_age=15 * 60,
    )

    # Refresh Token (long-lived)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="Lax",
        expires=refresh_exp,  # Uses the calculated datetime for long expiry
    )

    return Response(
        status_code=status.HTTP_200_OK,
        content=json.dumps(
            {"msg": "Login successful", "user_id": validated_user.id}
        ),
        media_type="application/json",
    )


@router.post("/verify-account")
async def verify_account(
    userdata: OTPVerification,
    response: Response,
    session: AsyncSession = Depends(get_session),
):
    is_otp_valid = await crud.verify_otp(
        userdata.user_id, userdata.identifier, userdata.otp_code, session
    )
    if not is_otp_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="OTP verification failed"
        )
    # Fetch User data using the ID linked in the OTP record
    current_user_data = await crud.current_user(userdata.identifier, session)

    # create tokens
    access_token, refresh_token, refresh_exp = await create_tokens(
        current_user_data.id, current_user_data.role
    )
    # hash refresh_token
    hashed_refresh_token = await hash_password(refresh_token)
    # store session in db
    await crud.create_session(
        current_user_data.id, hashed_refresh_token, refresh_exp, session
    )

    # Access Token (short-lived)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="Lax",
        max_age=15 * 60,
    )

    # Refresh Token (long-lived)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="Lax",
        expires=refresh_exp,  # Uses the calculated datetime for long expiry
    )

    # 5. Return success message (tokens are in the headers, not the body)
    return {"msg": f"OTP verification successful"}


@router.post("/token/refresh")
async def refresh_access_token(
    response: Response,
    # 1. Access the Refresh Token sent in the cookie
    refresh_token: str = Cookie(None),
    session: AsyncSession = Depends(get_session),
):
    # --- 401 Unauthorized Checks ---
    if not refresh_token:
        # Deny access if the refresh cookie is missing
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token required for renewal.",
        )

    # 2. Hash the received token to check against the database hash
    hashed_incoming_token = await hash_password(refresh_token)

    # 3. Query the DB for an active session matching the hashed token
    result = await crud.active_sessions(hashed_incoming_token, session)
    db_session = result[0] if result else None

    if not db_session:
        # Token might be fake or revoked
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or revoked token.")

    # 4. Check if the session has expired (Server-side expiry check)
    if db_session.expires_at < datetime.utcnow():
        # Clean up the expired record
        await crud.delete_session(db_session, session)
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Session expired, please log in again."
        )

    # --- Token Renewal ---

    # 5. Fetch the user associated with the session
    user = await crud.get_user_by_id(db_session.user_id, session)
    if not user:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "User associated with session not found."
        )

    # 6. Generate a NEW Access Token
    access_token, _, _ = await create_tokens(user.id, user.role)

    # 7. Set the NEW Access Token in the response cookie (OVERWRITING the expired one)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="Lax",
        max_age=15 * 60,  # Set to 15 minutes again
    )

    return {"msg": "Access token refreshed successfully."}


@router.get("/me", response_model=ReadUser)
async def get_me(current_user = Depends(get_current_user)):
    """Get current authenticated user's information."""
    return current_user
