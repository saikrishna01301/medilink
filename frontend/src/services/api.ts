// API Base URL
// Use relative path so calls go through Next.js rewrite: /api -> backend origin
const API_BASE_URL = "/api";

// API Response types
export interface SignUpRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  role: "doctor" | "patient" | "insurer" | "pharmacist";
  accepted_terms: boolean;
}

export interface SignUpResponse {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  accepted_terms: boolean;
}

export interface LoginRequest {
  email_or_phone: string;
  password: string;
  role?: string; // Optional role selection for login
}

export interface LoginResponse {
  msg: string;
  user_id?: number;
  user?: CurrentUserResponse;
  requires_action?: boolean;
  action_type?: "patient_to_service_provider" | "service_provider_to_patient";
  options?: {
    option1: {
      action: string;
      label: string;
      role?: string;
    };
    option2: {
      action: string;
      label: string;
      role?: string;
    };
  };
}

export interface OTPVerificationRequest {
  user_id: number;
  identifier: string;
  otp_code: string;
}

export interface OTPVerificationResponse {
  msg: string;
}

export interface CurrentUserResponse {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  accepted_terms: boolean;
}

// API Error type
export class APIError extends Error {
  constructor(
    public status: number,
    public detail: string
  ) {
    super(detail);
    this.name = "APIError";
  }
}

// API Functions
export const authAPI = {
  // Sign up new user
  signUp: async (data: SignUpRequest): Promise<SignUpResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important: Include cookies
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(response.status, error.detail || "Sign up failed");
    }

    return response.json();
  },

  // Login user
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important: Include cookies for token storage
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(response.status, error.detail || "Login failed");
    }

    return response.json();
  },

  // Verify OTP
  verifyOTP: async (
    data: OTPVerificationRequest
  ): Promise<OTPVerificationResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important: Include cookies
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(
        response.status,
        error.detail || "OTP verification failed"
      );
    }

    return response.json();
  },

  // Refresh access token
  refreshToken: async (): Promise<{ msg: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/token/refresh`, {
      method: "POST",
      credentials: "include", // Important: Include cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(
        response.status,
        error.detail || "Token refresh failed"
      );
    }

    return response.json();
  },

  // Get current user (requires authentication)
  getCurrentUser: async (): Promise<CurrentUserResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      credentials: "include", // Important: Include cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(
        response.status,
        error.detail || "Failed to fetch user data"
      );
    }

    return response.json();
  },

  // Create patient account for existing service provider
  createPatientAccount: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/create-patient-account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important: Include cookies
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(
        response.status,
        error.detail || "Failed to create patient account"
      );
    }

    return response.json();
  },
};

// Doctor Profile Types
export interface DoctorProfile {
  id: number;
  user_id: number;
  specialty: string;
  bio?: string;
  photo_url?: string;
  years_of_experience?: number;
  medical_license_number?: string;
  board_certifications?: string[];
  languages_spoken?: string[];
  created_at: string;
  updated_at?: string;
}

export interface DoctorClinic {
  assignment_id: number;
  clinic_id: number;
  clinic_name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  is_primary: boolean;
  consultation_fee?: number;
  available_from?: string;
  available_to?: string;
  days_of_week?: number[];
  accepting_new_patients: boolean;
}

export interface DoctorProfileData {
  user: {
    id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
    phone: string;
    emergency_contact?: string;
  };
  profile: DoctorProfile | null;
  clinics: DoctorClinic[];
}

export interface DoctorProfileUpdate {
  specialty?: string;
  bio?: string;
  photo_url?: string;
  years_of_experience?: number;
  medical_license_number?: string;
  board_certifications?: string[];
  languages_spoken?: string[];
}

export interface UserInfoUpdate {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  phone?: string;
  emergency_contact?: string;
}

export interface DoctorListItem {
  id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email: string;
  phone?: string | null;
  specialty?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  years_of_experience?: number | null;
  languages_spoken: string[];
  board_certifications: string[];
}

export interface CalendarEventDateTime {
  date?: string;
  dateTime?: string;
  timeZone?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: CalendarEventDateTime;
  end?: CalendarEventDateTime;
  location?: string;
  colorId?: string;
  status?: string;
  htmlLink?: string;
  [key: string]: unknown;
}

export interface CalendarEventsResponse {
  primary: GoogleCalendarEvent[];
  holidays: GoogleCalendarEvent[];
}

export interface CreateCalendarEventRequest {
  summary: string;
  description?: string;
  start: CalendarEventDateTime;
  end: CalendarEventDateTime;
  location?: string;
  colorId?: string;
  attendees?: Array<{ email: string }>;
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
  [key: string]: unknown;
}

// Doctor API Functions
export const doctorAPI = {
  // List doctors for discovery
  listDoctors: async (
    params?: { search?: string; specialty?: string }
  ): Promise<DoctorListItem[]> => {
    const query = new URLSearchParams();
    if (params?.search) {
      query.append("search", params.search);
    }
    if (params?.specialty && params.specialty !== "All Specialties") {
      query.append("specialty", params.specialty);
    }

    const url = query.toString()
      ? `${API_BASE_URL}/doctors?${query.toString()}`
      : `${API_BASE_URL}/doctors`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(
        response.status,
        error.detail || "Failed to fetch doctors"
      );
    }

    return response.json();
  },

  listSpecialties: async (): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/doctors/specialties`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(
        response.status,
        error.detail || "Failed to fetch specialties"
      );
    }

    return response.json();
  },

  // Get doctor profile
  getProfile: async (): Promise<DoctorProfileData> => {
    const response = await fetch(`${API_BASE_URL}/doctors/profile`, {
      method: "GET",
      credentials: "include", // Important: Include cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(
        response.status,
        error.detail || "Failed to fetch doctor profile"
      );
    }

    return response.json();
  },

  // Update doctor profile
  updateProfile: async (
    data: DoctorProfileUpdate
  ): Promise<DoctorProfileData> => {
    const response = await fetch(`${API_BASE_URL}/doctors/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important: Include cookies
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(
        response.status,
        error.detail || "Failed to update doctor profile"
      );
    }

    return response.json();
  },

  // Update user info
  updateUserInfo: async (data: UserInfoUpdate): Promise<DoctorProfileData> => {
    const response = await fetch(`${API_BASE_URL}/doctors/user-info`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important: Include cookies
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(
        response.status,
        error.detail || "Failed to update user information"
      );
    }

    return response.json();
  },

  // Upload profile picture
  uploadProfilePicture: async (file: File): Promise<{ message: string; photo_url: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/doctors/upload-profile-picture`, {
      method: "POST",
      credentials: "include", // Important: Include cookies
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(
        response.status,
        error.detail || "Failed to upload profile picture"
      );
    }

    return response.json();
  },

  // Delete profile picture
  deleteProfilePicture: async (): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/doctors/profile-picture`, {
      method: "DELETE",
      credentials: "include", // Important: Include cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(
        response.status,
        error.detail || "Failed to delete profile picture"
      );
    }

    return response.json();
  },
};

export const calendarAPI = {
  listEvents: async (params?: {
    timeMin?: string;
    timeMax?: string;
    includeHolidays?: boolean;
    maxResults?: number;
  }): Promise<CalendarEventsResponse> => {
    const query = new URLSearchParams();
    if (params?.timeMin) query.append("time_min", params.timeMin);
    if (params?.timeMax) query.append("time_max", params.timeMax);
    if (params?.includeHolidays) query.append("include_holidays", "true");
    if (params?.maxResults) query.append("max_results", params.maxResults.toString());

    const url = query.toString()
      ? `${API_BASE_URL}/calendar/google/events?${query.toString()}`
      : `${API_BASE_URL}/calendar/google/events`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(
        response.status,
        error.detail || "Failed to fetch calendar events"
      );
    }

    return response.json();
  },

  createEvent: async (
    payload: CreateCalendarEventRequest
  ): Promise<GoogleCalendarEvent> => {
    const response = await fetch(`${API_BASE_URL}/calendar/google/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(
        response.status,
        error.detail || "Failed to create calendar event"
      );
    }

    return response.json();
  },
};

