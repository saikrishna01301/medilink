import sys

# Alias so imports via "db" and "app.db" share the same module instance.
sys.modules.setdefault("app.db", sys.modules[__name__])
sys.modules.setdefault("db", sys.modules[__name__])

from .base import Base
from .database import engine, sessionLocal, init_db, get_session
from .models import (
    User,
    DBSession,
    OTPStore,
    DoctorProfile,
    DoctorSocialLink,
    Specialty,
    DoctorSpecialty,
    Appointment,
    Address,
    PatientProfile,
    PatientMeasurement,
    PatientMedicalCondition,
    PatientDiagnosis,
    PatientInsurancePolicy,
    PatientInsurancePolicyMember,
    InsurancePolicyDocument,
    PatientFile,
    ChatHistory,
)
from .crud import auth_crud, assistant_crud

__all__ = [
    "Base",
    "engine",
    "sessionLocal",
    "init_db",
    "auth_model",
    "user_model",
    "auth_crud",
    "get_session",
    "User",
    "DBSession",
    "OTPStore",
    "DoctorProfile",
    "DoctorSocialLink",
    "Specialty",
    "DoctorSpecialty",
    "Appointment",
    "Address",
    "PatientProfile",
    "PatientMeasurement",
    "PatientMedicalCondition",
    "PatientDiagnosis",
    "PatientInsurancePolicy",
    "PatientInsurancePolicyMember",
    "InsurancePolicyDocument",
    "PatientFile",
    "ChatHistory",
    "assistant_crud",
]
