from __future__ import annotations

from datetime import date, datetime, timezone
from typing import List, Optional
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db import (
    PatientInsurancePolicy,
    InsurancePolicyDocument,
    PatientFile,
    PatientInsurancePolicyMember,
)
from schemas.insurance_schema import (
    InsurancePolicyCreate,
    InsurancePolicyUpdate,
    InsurancePolicyRead,
    InsuranceMember,
)


async def _unset_primary_policies(
    patient_user_id: int,
    session: AsyncSession,
    exclude_policy_id: Optional[UUID] = None,
) -> None:
    """Unset existing primary policies for a patient."""
    query = select(PatientInsurancePolicy).where(
        PatientInsurancePolicy.patient_user_id == patient_user_id,
        PatientInsurancePolicy.is_primary == True,  # noqa: E712
    )
    if exclude_policy_id is not None:
        query = query.where(PatientInsurancePolicy.id != exclude_policy_id)

    result = await session.execute(query)
    for policy in result.scalars().all():
        policy.is_primary = False


def _serialize_policy(policy: PatientInsurancePolicy) -> dict:
    """Convert a policy model to a dict for InsurancePolicyRead schema."""
    policy_members: Optional[List[InsuranceMember]] = None
    if hasattr(policy, "policy_members") and policy.policy_members:
        policy_members = [
            InsuranceMember(
                name=member.full_name,
                relationship=member.relationship,
                date_of_birth=member.date_of_birth,
            )
            for member in policy.policy_members
        ]

    # Extract file information from policy_documents
    policy_files = []
    if hasattr(policy, "policy_documents") and policy.policy_documents:
        for doc_link in policy.policy_documents:
            if doc_link.patient_file:
                policy_files.append({
                    "id": doc_link.patient_file.id,
                    "file_name": doc_link.patient_file.file_name,
                    "file_url": doc_link.patient_file.file_url,
                    "file_type": doc_link.patient_file.file_type,
                    "file_size": doc_link.patient_file.file_size,
                    "created_at": doc_link.patient_file.created_at.isoformat() if doc_link.patient_file.created_at else None,
                })
    
    return {
        "id": policy.id,
        "patient_user_id": policy.patient_user_id,
        "insurer_name": policy.insurer_name,
        "plan_name": policy.plan_name,
        "policy_number": policy.policy_number,
        "group_number": policy.group_number,
        "insurance_number": policy.insurance_number,
        "coverage_start": policy.coverage_start,
        "coverage_end": policy.coverage_end,
        "is_primary": policy.is_primary,
        "cover_amount": float(policy.cover_amount)
        if policy.cover_amount is not None
        else None,
        "policy_members": policy_members if policy_members else None,
        "policy_files": policy_files,
        "created_at": policy.created_at.isoformat() if policy.created_at else None,
        "updated_at": policy.updated_at.isoformat() if policy.updated_at else None,
    }


async def get_patient_insurance_policies(
    patient_user_id: int, session: AsyncSession
) -> List[PatientInsurancePolicy]:
    """Get all insurance policies for a patient."""
    result = await session.execute(
        select(PatientInsurancePolicy)
        .where(PatientInsurancePolicy.patient_user_id == patient_user_id)
        .options(
            selectinload(PatientInsurancePolicy.policy_documents).selectinload(
                InsurancePolicyDocument.patient_file
            ),
            selectinload(PatientInsurancePolicy.policy_members),
        )
        .order_by(
            PatientInsurancePolicy.is_primary.desc(),
            PatientInsurancePolicy.coverage_start.desc(),
        )
    )
    return list(result.scalars().all())


async def get_insurance_policy(
    policy_id: UUID, patient_user_id: int, session: AsyncSession
) -> Optional[PatientInsurancePolicy]:
    """Get a specific insurance policy by ID."""
    result = await session.execute(
        select(PatientInsurancePolicy)
        .where(
            PatientInsurancePolicy.id == policy_id,
            PatientInsurancePolicy.patient_user_id == patient_user_id,
        )
        .options(
            selectinload(PatientInsurancePolicy.policy_documents).selectinload(
                InsurancePolicyDocument.patient_file
            ),
            selectinload(PatientInsurancePolicy.policy_members),
        )
    )
    return result.scalar_one_or_none()


async def create_insurance_policy(
    patient_user_id: int,
    policy_data: InsurancePolicyCreate,
    session: AsyncSession,
) -> PatientInsurancePolicy:
    """Create a new insurance policy for a patient."""
    # If this is set as primary, unset other primary policies
    if policy_data.is_primary:
        await _unset_primary_policies(patient_user_id, session)

    policy = PatientInsurancePolicy(
        patient_user_id=patient_user_id,
        insurer_name=policy_data.insurer_name,
        plan_name=policy_data.plan_name,
        policy_number=policy_data.policy_number,
        group_number=policy_data.group_number,
        insurance_number=policy_data.insurance_number,
        coverage_start=policy_data.coverage_start,
        coverage_end=policy_data.coverage_end,
        is_primary=policy_data.is_primary,
        cover_amount=policy_data.cover_amount,
    )
    session.add(policy)
    await session.flush()

    if policy_data.policy_members:
        members = [
            PatientInsurancePolicyMember(
                policy_id=policy.id,
                full_name=member.name,
                relationship=member.relationship,
                date_of_birth=member.date_of_birth,
            )
            for member in policy_data.policy_members
        ]
        session.add_all(members)

    await session.commit()
    return await get_insurance_policy(policy.id, patient_user_id, session)


async def update_insurance_policy(
    policy_id: UUID,
    patient_user_id: int,
    policy_data: InsurancePolicyUpdate,
    session: AsyncSession,
) -> Optional[PatientInsurancePolicy]:
    """Update an existing insurance policy."""
    policy = await get_insurance_policy(policy_id, patient_user_id, session)
    if not policy:
        return None

    # If setting as primary, unset other primary policies
    if policy_data.is_primary is True:
        await _unset_primary_policies(
            patient_user_id, session, exclude_policy_id=policy_id
        )

    # Update fields
    if policy_data.insurer_name is not None:
        policy.insurer_name = policy_data.insurer_name
    if policy_data.plan_name is not None:
        policy.plan_name = policy_data.plan_name
    if policy_data.policy_number is not None:
        policy.policy_number = policy_data.policy_number
    if policy_data.group_number is not None:
        policy.group_number = policy_data.group_number
    if policy_data.insurance_number is not None:
        policy.insurance_number = policy_data.insurance_number
    if policy_data.coverage_start is not None:
        policy.coverage_start = policy_data.coverage_start
    if policy_data.coverage_end is not None:
        policy.coverage_end = policy_data.coverage_end
    if policy_data.is_primary is not None:
        policy.is_primary = policy_data.is_primary
    if policy_data.cover_amount is not None:
        policy.cover_amount = policy_data.cover_amount

    if policy_data.policy_members is not None:
        await session.execute(
            delete(PatientInsurancePolicyMember).where(
                PatientInsurancePolicyMember.policy_id == policy_id
            )
        )
        if policy_data.policy_members:
            session.add_all(
                [
                    PatientInsurancePolicyMember(
                        policy_id=policy_id,
                        full_name=member.name,
                        relationship=member.relationship,
                        date_of_birth=member.date_of_birth,
                    )
                    for member in policy_data.policy_members
                ]
            )

    policy.updated_at = datetime.now(timezone.utc)
    await session.commit()
    return await get_insurance_policy(policy_id, patient_user_id, session)


async def link_files_to_policy(
    policy_id: UUID,
    file_ids: List[int],
    session: AsyncSession,
) -> bool:
    """Link patient files to an insurance policy."""
    # Verify policy exists
    policy_result = await session.execute(
        select(PatientInsurancePolicy).where(PatientInsurancePolicy.id == policy_id)
    )
    policy = policy_result.scalar_one_or_none()
    if not policy:
        return False
    
    # Remove existing links
    existing_links_result = await session.execute(
        select(InsurancePolicyDocument).where(
            InsurancePolicyDocument.policy_id == policy_id
        )
    )
    for link in existing_links_result.scalars().all():
        await session.delete(link)
    
    # Create new links
    for file_id in file_ids:
        # Verify file exists
        file = await session.scalar(
            select(PatientFile).where(PatientFile.id == file_id)
        )
        if file:
            link = InsurancePolicyDocument(
                policy_id=policy_id,
                patient_file_id=file_id,
            )
            session.add(link)
    
    await session.commit()
    return True


async def delete_insurance_policy(
    policy_id: UUID,
    patient_user_id: int,
    session: AsyncSession,
) -> bool:
    """Delete an insurance policy."""
    policy = await get_insurance_policy(policy_id, patient_user_id, session)
    if not policy:
        return False

    await session.delete(policy)
    await session.commit()
    return True


async def get_insurance_summary(
    patient_user_id: int, session: AsyncSession
) -> dict:
    """Get insurance summary with active and expired counts."""
    today = date.today()
    
    all_policies = await get_patient_insurance_policies(patient_user_id, session)
    
    active_policies = [
        p for p in all_policies
        if p.coverage_end is None or p.coverage_end >= today
    ]
    
    expired_policies = [
        p for p in all_policies
        if p.coverage_end is not None and p.coverage_end < today
    ]
    
    return {
        "total_active": len(active_policies),
        "total_expired": len(expired_policies),
        "policies": all_policies,
    }

