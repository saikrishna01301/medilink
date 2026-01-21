from datetime import datetime, date, time
from app.db.crud import (
    doctor_crud,
    appointment_request_crud,
    auth_crud,
    assistant_crud,
    appointment_request_crud,
)


# clear assistant chat history
async def clear_chat(session, user_id):
    return await assistant_crud.clear_chat_history(session=session, user_id=user_id)


# search doctors
async def tool_search_doctors(session, user_id, params):
    # use structured filters when provided; keep search flexible
    location = (params.get("location") or "").strip().lower()
    doctors = await doctor_crud.list_doctors_with_profiles(
        session,
        search=params.get("search"),
        specialty=params.get("specialty"),
        patient_latitude=params.get("patient_latitude"),
        patient_longitude=params.get("patient_longitude"),
    )
    # apply a lightweight location filter on clinics when the city/state hint is provided
    if location:
        filtered = []
        for d in doctors:
            for clinic in d.get("clinics") or []:
                city_state = " ".join(
                    filter(
                        None,
                        [
                            clinic.get("city"),
                            clinic.get("state"),
                            clinic.get("address_line1"),
                        ],
                    )
                ).lower()
                if location in city_state:
                    filtered.append(d)
                    break
        # if nothing matches the location hint, fall back to the unfiltered list
        if filtered:
            doctors = filtered

    top = doctors[:5]
    simplified = []
    for d in top:
        clinics = d.get("clinics") or []
        primary_clinic = clinics[0] if clinics else {}
        doctor_user_id = d.get("id") or d.get("user_id")
        simplified.append(
            {
                "doctor_user_id": doctor_user_id,
                "name": f"{d.get('first_name','')} {d.get('last_name','')}".strip(),
                "specialty": d.get("specialty") or d.get("primary_specialty"),
                "clinic_id": primary_clinic.get("id"),
                "clinic_name": primary_clinic.get("clinic_name"),
                "next_available": d.get("next_available"),
                "rating": d.get("google_rating"),
            }
        )
    return {"results": simplified}


# book appointment
async def tool_book_appointment(session, user_id, params):
    user = await auth_crud.get_user_by_id(user_id, session)
    if not user or not user.is_patient:
        return {"error": "Only patients can request appointments"}

    try:
        preferred_date = (
            datetime.fromisoformat(params["preferred_date"]).date()
            if params.get("preferred_date")
            else date.today()
        )
    except Exception:
        return {"error": "Invalid preferred_date; use YYYY-MM-DD"}

    try:
        preferred_time = (
            time.fromisoformat(params["preferred_time_slot_start"])
            if params.get("preferred_time_slot_start")
            else time(hour=9, minute=0)
        )
    except Exception:
        return {"error": "Invalid preferred_time_slot_start; use HH:MM"}

    try:
        req = await appointment_request_crud.create_appointment_request(
            session,
            patient_user_id=user_id,
            doctor_user_id=params.get("doctor_user_id"),
            clinic_id=params.get("clinic_id"),
            preferred_date=preferred_date,
            preferred_time_slot_start=preferred_time,
            is_flexible=bool(params.get("is_flexible", False)),
            reason=params.get("reason") or "appointment",
            notes=params.get("notes"),
        )
    except Exception as e:
        return {"error": f"Failed to book appointment: {e}"}

    return {
        "appointment_request_id": req.request_id,
        "status": req.status if hasattr(req, "status") else "pending",
        "doctor_user_id": req.doctor_user_id,
        "clinic_id": req.clinic_id,
        "preferred_date": preferred_date.isoformat(),
        "preferred_time": preferred_time.isoformat(timespec="minutes"),
    }


# list appointments status for a patient
async def status_patient_appointments(
    session, user_id, params=None
):  # params unused; kept for parity
    status = None
    if isinstance(params, dict):
        status = params.get("status")

    list_of_status = (
        await appointment_request_crud.list_appointment_requests_for_patient(
            session, user_id, status
        )
    )
    results = []
    for req in list_of_status:
        current_doctor = await auth_crud.get_user_by_id(req.doctor_user_id, session)
        results.append(
            {
                "appointment_request_id": req.request_id,
                "doctor_user_id": req.doctor_user_id,
                "doctor_name": f"{getattr(current_doctor, 'first_name', '')} {getattr(current_doctor, 'last_name', '')}".strip(),
                "clinic_id": req.clinic_id,
                "preferred_date": (
                    req.preferred_date.isoformat() if req.preferred_date else None
                ),
                "preferred_time": (
                    req.preferred_time_slot_start.isoformat(timespec="minutes")
                    if req.preferred_time_slot_start
                    else None
                ),
            }
        )
    return {"appointments": results}


# doctor: list appointment requests
async def status_doctor_appointments_requests(session, user_id, params=None):
    status = None
    if isinstance(params, dict):
        status = params.get("status")

    list_of_requests = (
        await appointment_request_crud.list_appointment_requests_for_doctor(
            session, user_id, status
        )
    )

    results = []
    for req in list_of_requests:
        current_patient = await auth_crud.get_user_by_id(req.patient_user_id, session)
        results.append(
            {
                "appointment_request_id": req.request_id,
                "status": req.status if hasattr(req, "status") else "pending",
                "patient_user_id": req.patient_user_id,
                "patient_name": f"{getattr(current_patient, 'first_name', '')} {getattr(current_patient, 'last_name', '')}".strip(),
                "clinic_id": req.clinic_id,
                "preferred_date": (
                    req.preferred_date.isoformat() if req.preferred_date else None
                ),
                "preferred_time": (
                    req.preferred_time_slot_start.isoformat(timespec="minutes")
                    if req.preferred_time_slot_start
                    else None
                ),
            }
        )
    return {"appointment_requests": results}
