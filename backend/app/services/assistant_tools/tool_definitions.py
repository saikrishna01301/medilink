tools = [
    {
        "type": "function",
        "function": {
            "name": "clear_chat",
            "description": "Clears the chat history for the current authenticated user.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_doctors",
            "description": "Search doctors by specialty name / name and return top matches.",
            "parameters": {
                "type": "object",
                "properties": {
                    "search": {"type": "string", "description": "Name or keyword"},
                    "specialty": {"type": "string", "description": "Specialty filter"},
                    "location": {
                        "type": "string",
                        "description": "City or location hint",
                    },
                    "patient_latitude": {
                        "type": "number",
                        "description": "Patient latitude",
                    },
                    "patient_longitude": {
                        "type": "number",
                        "description": "Patient longitude",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "book_appointment",
            "description": "Create an appointment request for the authenticated patient.",
            "parameters": {
                "type": "object",
                "properties": {
                    "doctor_user_id": {
                        "type": "integer",
                        "description": "Target doctor user_id",
                    },
                    "clinic_id": {
                        "type": "integer",
                        "description": "Clinic id for booking",
                    },
                    "preferred_date": {"type": "string", "description": "YYYY-MM-DD"},
                    "preferred_time_slot_start": {
                        "type": "string",
                        "description": "HH:MM",
                    },
                    "is_flexible": {
                        "type": "boolean",
                        "description": "Allow doctor to suggest alternatives",
                    },
                    "reason": {
                        "type": "string",
                        "description": "Reason for appointment",
                    },
                    "notes": {
                        "type": "string",
                        "description": "Optional notes",
                        "nullable": True,
                    },
                },
                "required": [
                    "doctor_user_id",
                    "clinic_id",
                    "preferred_date",
                    "preferred_time_slot_start",
                    "is_flexible",
                    "reason",
                ],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "appointment_status",
            "description": "See status of all appointment requests for the authenticated patient.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "doctor_appointment_requests",
            "description": "See status of all appointment requests received by the authenticated doctor.",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "description": "Filter by status (pending, accepted, rejected, doctor_suggested_alternative)",
                    },
                },
                "required": [],
            },
        },
    },
]
