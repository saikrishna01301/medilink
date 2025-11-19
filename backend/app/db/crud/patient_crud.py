from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from db import (
    PatientProfile,
    PatientMeasurement,
    PatientMedicalCondition,
    PatientDiagnosis,
    User,
)
from db.models.patient_model import (
    MeasurementTypeEnum,
    ConditionStatusEnum,
    DiagnosisStatusEnum,
)


async def get_patient_profile(user_id: int, session: AsyncSession) -> Optional[PatientProfile]:
    result = await session.execute(
        select(PatientProfile).where(PatientProfile.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def ensure_patient_profile(user_id: int, session: AsyncSession) -> PatientProfile:
    profile = await get_patient_profile(user_id, session)
    if profile:
        return profile

    profile = PatientProfile(user_id=user_id)
    session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile


def _serialize_measurement(measurement: PatientMeasurement) -> Dict[str, Any]:
    return {
        "id": measurement.id,
        "measurement_type": measurement.measurement_type.value,
        "value": float(measurement.value) if measurement.value is not None else None,
        "unit": measurement.unit,
        "source": measurement.source,
        "recorded_at": measurement.recorded_at,
    }


def _serialize_condition(condition: PatientMedicalCondition) -> Dict[str, Any]:
    return {
        "id": condition.id,
        "condition_name": condition.condition_name,
        "status": condition.status.value,
        "diagnosed_on": condition.diagnosed_on,
        "notes": condition.notes,
        "is_chronic": condition.is_chronic,
        "created_at": condition.created_at,
        "updated_at": condition.updated_at,
    }


def _serialize_diagnosis(diagnosis: PatientDiagnosis) -> Dict[str, Any]:
    return {
        "id": diagnosis.id,
        "disease_name": diagnosis.disease_name,
        "icd10_code": diagnosis.icd10_code,
        "status": diagnosis.status.value,
        "diagnosed_on": diagnosis.diagnosed_on,
        "notes": diagnosis.notes,
        "created_at": diagnosis.created_at,
        "updated_at": diagnosis.updated_at,
    }


def _safe_condition_status(value: Optional[str]) -> ConditionStatusEnum:
    if not value:
        return ConditionStatusEnum.active
    try:
        return ConditionStatusEnum(value)
    except ValueError:
        return ConditionStatusEnum.active


def _safe_diagnosis_status(value: Optional[str]) -> DiagnosisStatusEnum:
    if not value:
        return DiagnosisStatusEnum.active
    try:
        return DiagnosisStatusEnum(value)
    except ValueError:
        return DiagnosisStatusEnum.active


async def get_patient_profile_with_details(user_id: int, session: AsyncSession) -> Optional[Dict[str, Any]]:
    user = await session.scalar(select(User).where(User.id == user_id))
    if not user:
        return None

    profile = await ensure_patient_profile(user_id, session)

    conditions_result = await session.execute(
        select(PatientMedicalCondition).where(
            PatientMedicalCondition.patient_profile_id == profile.id
        ).order_by(PatientMedicalCondition.created_at)
    )
    diagnoses_result = await session.execute(
        select(PatientDiagnosis).where(
            PatientDiagnosis.patient_profile_id == profile.id
        ).order_by(PatientDiagnosis.created_at)
    )
    height_history_result = await session.execute(
        select(PatientMeasurement)
        .where(
            PatientMeasurement.patient_profile_id == profile.id,
            PatientMeasurement.measurement_type == MeasurementTypeEnum.height,
        )
        .order_by(PatientMeasurement.recorded_at.desc())
        .limit(10)
    )
    weight_history_result = await session.execute(
        select(PatientMeasurement)
        .where(
            PatientMeasurement.patient_profile_id == profile.id,
            PatientMeasurement.measurement_type == MeasurementTypeEnum.weight,
        )
        .order_by(PatientMeasurement.recorded_at.desc())
        .limit(10)
    )

    return {
        "user": {
            "id": user.id,
            "first_name": user.first_name,
            "middle_name": user.middle_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.phone,
            "emergency_contact": user.emergency_contact,
        },
        "profile": {
            "id": profile.id,
            "user_id": profile.user_id,
            "date_of_birth": profile.date_of_birth,
            "bio": profile.bio,
            "gender": profile.gender,
            "blood_type": profile.blood_type,
            "photo_url": profile.photo_url,
            "cover_photo_url": profile.cover_photo_url,
            "current_height_cm": float(profile.current_height_cm)
            if profile.current_height_cm is not None
            else None,
            "current_weight_kg": float(profile.current_weight_kg)
            if profile.current_weight_kg is not None
            else None,
            "last_height_recorded_at": profile.last_height_recorded_at,
            "last_weight_recorded_at": profile.last_weight_recorded_at,
            "created_at": profile.created_at,
            "updated_at": profile.updated_at,
        },
        "medical_conditions": [_serialize_condition(cond) for cond in conditions_result.scalars().all()],
        "diagnosed_diseases": [_serialize_diagnosis(diag) for diag in diagnoses_result.scalars().all()],
        "measurements": {
            "height_history": [_serialize_measurement(m) for m in height_history_result.scalars().all()],
            "weight_history": [_serialize_measurement(m) for m in weight_history_result.scalars().all()],
        },
    }


async def _record_measurement(
    profile: PatientProfile,
    measurement_type: MeasurementTypeEnum,
    value: float,
    unit: str,
    session: AsyncSession,
) -> None:
    measurement = PatientMeasurement(
        patient_profile_id=profile.id,
        measurement_type=measurement_type,
        value=value,
        unit=unit,
    )
    session.add(measurement)
    now = datetime.now(timezone.utc)
    if measurement_type == MeasurementTypeEnum.height:
        profile.current_height_cm = value
        profile.last_height_recorded_at = now
    else:
        profile.current_weight_kg = value
        profile.last_weight_recorded_at = now


async def _replace_medical_conditions(
    profile: PatientProfile,
    items: Optional[List[Dict[str, Any]]],
    session: AsyncSession,
) -> None:
    await session.execute(
        delete(PatientMedicalCondition).where(
            PatientMedicalCondition.patient_profile_id == profile.id
        )
    )
    if not items:
        return

    for item in items:
        name = (item.get("condition_name") or item.get("name") or "").strip()
        if not name:
            continue
        status_enum = _safe_condition_status(item.get("status"))
        condition = PatientMedicalCondition(
            patient_profile_id=profile.id,
            condition_name=name,
            status=status_enum,
            diagnosed_on=item.get("diagnosed_on"),
            notes=item.get("notes"),
            is_chronic=item.get("is_chronic", True),
        )
        session.add(condition)


async def _replace_diagnoses(
    profile: PatientProfile,
    items: Optional[List[Dict[str, Any]]],
    session: AsyncSession,
) -> None:
    await session.execute(
        delete(PatientDiagnosis).where(
            PatientDiagnosis.patient_profile_id == profile.id
        )
    )
    if not items:
        return

    for item in items:
        name = (item.get("disease_name") or item.get("name") or "").strip()
        if not name:
            continue
        status_enum = _safe_diagnosis_status(item.get("status"))
        diagnosis = PatientDiagnosis(
            patient_profile_id=profile.id,
            disease_name=name,
            icd10_code=item.get("icd10_code"),
            status=status_enum,
            diagnosed_on=item.get("diagnosed_on"),
            notes=item.get("notes"),
        )
        session.add(diagnosis)


async def update_patient_profile(
    user_id: int,
    update_data: Dict[str, Any],
    session: AsyncSession,
) -> Optional[Dict[str, Any]]:
    profile = await ensure_patient_profile(user_id, session)

    scalar_fields = ["bio", "date_of_birth", "gender", "blood_type", "photo_url", "cover_photo_url"]
    for field in scalar_fields:
        if field in update_data:
            setattr(profile, field, update_data[field])

    height_value = update_data.get("height_cm")
    if height_value is not None:
        await _record_measurement(profile, MeasurementTypeEnum.height, float(height_value), "cm", session)

    weight_value = update_data.get("weight_kg")
    if weight_value is not None:
        await _record_measurement(profile, MeasurementTypeEnum.weight, float(weight_value), "kg", session)

    if "medical_conditions" in update_data:
        await _replace_medical_conditions(profile, update_data.get("medical_conditions") or [], session)

    if "diagnosed_diseases" in update_data:
        await _replace_diagnoses(profile, update_data.get("diagnosed_diseases") or [], session)

    profile.updated_at = datetime.now(timezone.utc)
    session.add(profile)
    await session.commit()
    return await get_patient_profile_with_details(user_id, session)


async def update_user_info(
    user_id: int,
    user_data: Dict[str, Any],
    session: AsyncSession,
) -> Optional[User]:
    user = await session.scalar(select(User).where(User.id == user_id))
    if not user:
        return None

    for key, value in user_data.items():
        if value is not None:
            setattr(user, key, value)

    user.updated_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(user)
    return user

