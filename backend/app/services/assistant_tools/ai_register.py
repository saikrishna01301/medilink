from .ai_tools import (
    clear_chat,
    tool_search_doctors,
    tool_book_appointment,
    status_patient_appointments,
    status_doctor_appointments_requests,
)

# Registry mapping tool names to implementations
tool_registry = {
    "clear_chat": clear_chat,
    "search_doctors": tool_search_doctors,
    "book_appointment": tool_book_appointment,
    "appointment_status": status_patient_appointments,
    "doctor_appointment_requests": status_doctor_appointments_requests,
}
