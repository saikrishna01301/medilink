from uuid import UUID
from typing import List, Optional
import json

from fastapi import APIRouter, Cookie, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, distinct

from db import get_session
from db.crud import auth_crud, insurance_crud, patient_file_crud
from db.models import Appointment, User, DoctorProfile
from schemas.insurance_schema import (
    InsurancePolicyCreate,
    InsurancePolicyRead,
    InsurancePolicySummary,
    InsurancePolicyUpdate,
)
from services import get_storage_service
import uuid
import os

router = APIRouter()


async def get_current_patient(
    access_token: str = Cookie(None),
    session: AsyncSession = Depends(get_session),
):
    """Verify the current user is a patient."""
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    from services.auth_utils import verify_access_token

    payload = await verify_access_token(access_token)
    user_id = int(payload.get("sub"))

    user = await auth_crud.get_user_by_id(user_id, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if not user.is_patient:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Patient account required.",
        )

    return user


@router.get("/summary", response_model=InsurancePolicySummary)
async def get_insurance_summary(
    patient: "User" = Depends(get_current_patient),
    session: AsyncSession = Depends(get_session),
):
    """Get insurance summary with active/expired counts and all policies."""
    summary = await insurance_crud.get_insurance_summary(patient.id, session)
    return InsurancePolicySummary(
        total_active=summary["total_active"],
        total_expired=summary["total_expired"],
        policies=[
            InsurancePolicyRead.model_validate(insurance_crud._serialize_policy(p))
            for p in summary["policies"]
        ],
    )


@router.get("", response_model=list[InsurancePolicyRead])
async def list_insurance_policies(
    patient: "User" = Depends(get_current_patient),
    session: AsyncSession = Depends(get_session),
):
    """List all insurance policies for the current patient."""
    policies = await insurance_crud.get_patient_insurance_policies(patient.id, session)
    return [
        InsurancePolicyRead.model_validate(insurance_crud._serialize_policy(p))
        for p in policies
    ]


@router.get("/{policy_id}", response_model=InsurancePolicyRead)
async def get_insurance_policy(
    policy_id: UUID,
    patient: "User" = Depends(get_current_patient),
    session: AsyncSession = Depends(get_session),
):
    """Get a specific insurance policy by ID."""
    policy = await insurance_crud.get_insurance_policy(policy_id, patient.id, session)
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurance policy not found",
        )
    return InsurancePolicyRead.model_validate(insurance_crud._serialize_policy(policy))


@router.post("", response_model=InsurancePolicyRead, status_code=status.HTTP_201_CREATED)
async def create_insurance_policy(
    policy_data: InsurancePolicyCreate,
    patient: "User" = Depends(get_current_patient),
    session: AsyncSession = Depends(get_session),
):
    """Create a new insurance policy."""
    policy = await insurance_crud.create_insurance_policy(
        patient.id, policy_data, session
    )
    return InsurancePolicyRead.model_validate(insurance_crud._serialize_policy(policy))


@router.post("/with-files", response_model=InsurancePolicyRead, status_code=status.HTTP_201_CREATED)
async def create_insurance_policy_with_files(
    policy_json: str = Form(...),
    files: Optional[List[UploadFile]] = File(None),
    patient: "User" = Depends(get_current_patient),
    session: AsyncSession = Depends(get_session),
):
    """Create a new insurance policy with file uploads (up to 2 files)."""
    try:
        # Parse policy data from JSON string
        policy_data_dict = json.loads(policy_json)
        policy_data = InsurancePolicyCreate(**policy_data_dict)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON in policy_json field"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid policy data: {str(e)}"
        )
    
    # Validate file count
    if files and len(files) > 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 2 files allowed per policy"
        )
    
    # Create the policy first
    policy = await insurance_crud.create_insurance_policy(
        patient.id, policy_data, session
    )
    
    # Upload files and link them to the policy
    if files and len(files) > 0:
        file_ids = []
        try:
            storage_service = get_storage_service()
            
            # Create a file batch for insurance category
            batch = await patient_file_crud.create_file_batch(
                patient_user_id=patient.id,
                category="insurance",
                heading=f"Policy: {policy_data.insurer_name}",
                session=session
            )
            
            # Upload each file
            for file in files:
                if file.size > 10 * 1024 * 1024:  # 10MB limit
                    continue
                
                file_content = await file.read()
                file_extension = os.path.splitext(file.filename or "")[1]
                unique_filename = f"{uuid.uuid4()}{file_extension}"
                destination_path = f"patient-files/{patient.id}/insurance/{batch.id}/{unique_filename}"
                
                file_url = await storage_service.upload_file(
                    file_content=file_content,
                    destination_path=destination_path,
                    content_type=file.content_type or "application/octet-stream"
                )
                
                # Create patient file record
                patient_file = await patient_file_crud.create_patient_file(
                    file_batch_id=batch.id,
                    file_name=file.filename or "unknown",
                    file_url=file_url,
                    file_type=file.content_type or "application/octet-stream",
                    file_size=len(file_content),
                    session=session
                )
                
                file_ids.append(patient_file.id)
            
            # Link files to policy
            if file_ids:
                await insurance_crud.link_files_to_policy(
                    policy_id=policy.id,
                    file_ids=file_ids,
                    session=session
                )
        except Exception as e:
            # If file upload fails, we still have the policy created
            # Log the error but don't fail the entire request
            print(f"Warning: Failed to upload files for policy {policy.id}: {str(e)}")
    
    # Refresh policy to get file relationships
    policy = await insurance_crud.get_insurance_policy(policy.id, patient.id, session)
    return InsurancePolicyRead.model_validate(insurance_crud._serialize_policy(policy))


@router.patch("/{policy_id}", response_model=InsurancePolicyRead)
async def update_insurance_policy(
    policy_id: UUID,
    policy_data: InsurancePolicyUpdate,
    patient: "User" = Depends(get_current_patient),
    session: AsyncSession = Depends(get_session),
):
    """Update an existing insurance policy."""
    policy = await insurance_crud.update_insurance_policy(
        policy_id, patient.id, policy_data, session
    )
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurance policy not found",
        )
    return InsurancePolicyRead.model_validate(insurance_crud._serialize_policy(policy))


@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_insurance_policy(
    policy_id: UUID,
    patient: "User" = Depends(get_current_patient),
    session: AsyncSession = Depends(get_session),
):
    """Delete an insurance policy."""
    success = await insurance_crud.delete_insurance_policy(
        policy_id, patient.id, session
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurance policy not found",
        )


@router.get("/consulting-doctors", response_model=List[dict])
async def get_consulting_doctors(
    patient: "User" = Depends(get_current_patient),
    session: AsyncSession = Depends(get_session),
):
    """Get list of doctors the patient has consulted with (from appointments)."""
    # Get distinct doctor_user_ids from appointments where patient_user_id matches
    result = await session.execute(
        select(distinct(Appointment.doctor_user_id))
        .where(Appointment.patient_user_id == patient.id)
        .where(Appointment.doctor_user_id.isnot(None))
    )
    doctor_ids = [row[0] for row in result.all() if row[0] is not None]
    
    if not doctor_ids:
        return []
    
    # Get doctor details
    doctors_result = await session.execute(
        select(User, DoctorProfile)
        .join(DoctorProfile, User.id == DoctorProfile.user_id, isouter=True)
        .where(User.id.in_(doctor_ids))
    )
    
    doctors = []
    for user, profile in doctors_result.all():
        doctors.append({
            "id": user.id,
            "first_name": user.first_name,
            "middle_name": user.middle_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.phone,
            "specialty": profile.specialty if profile else None,
            "photo_url": profile.photo_url if profile else None,
        })
    
    return doctors

