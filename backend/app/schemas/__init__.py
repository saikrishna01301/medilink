from .auth_schema import UserLogin, OTPVerification
from .user_schema import CreateUser, ReadUser
from .doctor_schema import (
    DoctorProfileCreate,
    DoctorProfileUpdate,
    DoctorProfileRead,
    DoctorProfileWithUser,
    DoctorListItem,
    DoctorSocialLinkCreate,
    DoctorSocialLinkUpdate,
    DoctorSocialLinkRead,
)
from .appointment_schema import AppointmentCreate, AppointmentRead
from .address_schema import AddressUpdate, AddressRead

__all__ = [
    UserLogin,
    OTPVerification,
    CreateUser,
    ReadUser,
    DoctorProfileCreate,
    DoctorProfileUpdate,
    DoctorProfileRead,
    DoctorProfileWithUser,
    DoctorListItem,
    DoctorSocialLinkCreate,
    DoctorSocialLinkUpdate,
    DoctorSocialLinkRead,
    AppointmentCreate,
    AppointmentRead,
    AddressUpdate,
    AddressRead,
]
