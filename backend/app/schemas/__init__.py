from .auth_schema import UserLogin, OTPVerification
from .user_schema import CreateUser, ReadUser
from .doctor_schema import (
    DoctorProfileCreate,
    DoctorProfileUpdate,
    DoctorProfileRead,
    DoctorProfileWithUser,
)

__all__ = [
    UserLogin,
    OTPVerification,
    CreateUser,
    ReadUser,
    DoctorProfileCreate,
    DoctorProfileUpdate,
    DoctorProfileRead,
    DoctorProfileWithUser,
]
