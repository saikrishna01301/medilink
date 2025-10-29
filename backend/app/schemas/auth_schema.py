from pydantic import BaseModel, Field, EmailStr


# user auth login model
class UserLogin(BaseModel):
    email_or_phone: str = Field(..., description="User's email or phone number")
    password: str = Field(
        ..., min_length=8, max_length=72, description="account password"
    )


class OTPVerification(BaseModel):
    user_id: int = Field(..., description="Unique ID of the user.")
    identifier: str = Field(..., description="Email or phone used for login.")
    otp_code: str = Field(
        ...,
        min_length=6,
        max_length=6,
        description="The 6-digit code sent to the user.",
    )
