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

export interface Address {
  address_id: number;
  user_id: number;
  label?: string | null;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  formatted_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  place_id?: string | null;
  location_source?: string | null;
  timezone?: string | null;
  raw_geocoding_payload?: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
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

type APIRequestOptions = RequestInit & {
  skipAuth?: boolean;
  retry?: boolean;
  defaultError?: string;
  expectJson?: boolean;
};

let refreshPromise: Promise<void> | null = null;

const parseErrorDetail = async (response: Response, fallback: string) => {
  try {
    const text = await response.text();
    if (!text) return fallback;
    const data = JSON.parse(text);
    return typeof data?.detail === "string" ? data.detail : fallback;
  } catch {
    return fallback;
  }
};

const refreshAccessToken = async (): Promise<void> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${API_BASE_URL}/auth/token/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const detail = await parseErrorDetail(
          response,
          "Failed to refresh session."
        );
        throw new APIError(response.status, detail);
      }
    })();
  }

  try {
    await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};

const apiFetch = async <T = unknown>(
  path: string,
  options: APIRequestOptions = {}
): Promise<T> => {
  const {
    skipAuth = false,
    retry = true,
    defaultError = "Request failed",
    expectJson = true,
    credentials,
    ...init
  } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: credentials ?? "include",
    ...init,
  });

  if (response.status === 401 && !skipAuth && retry) {
    try {
      await refreshAccessToken();
      return apiFetch<T>(path, { ...options, retry: false });
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(401, "Session expired. Please log in again.");
    }
  }

  if (!response.ok) {
    const detail = await parseErrorDetail(response, defaultError);
    throw new APIError(response.status, detail);
  }

  if (!expectJson || response.status === 204) {
    return undefined as T;
  }

  const responseText = await response.text();
  if (!responseText) {
    return undefined as T;
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new APIError(response.status, "Invalid response format.");
  }
};

// API Functions
export const authAPI = {
  // Sign up new user
  signUp: async (data: SignUpRequest): Promise<SignUpResponse> => {
    return apiFetch<SignUpResponse>("/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      skipAuth: true,
      defaultError: "Sign up failed",
    });
  },

  // Login user
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      skipAuth: true,
      defaultError: "Login failed",
    });
  },

  // Verify OTP
  verifyOTP: async (
    data: OTPVerificationRequest
  ): Promise<OTPVerificationResponse> => {
    return apiFetch<OTPVerificationResponse>("/auth/verify-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      skipAuth: true,
      defaultError: "OTP verification failed",
    });
  },

  // Refresh access token
  refreshToken: async (): Promise<{ msg: string }> => {
    return apiFetch<{ msg: string }>("/auth/token/refresh", {
      method: "POST",
      skipAuth: true,
      defaultError: "Token refresh failed",
    });
  },

  // Get current user (requires authentication)
  getCurrentUser: async (): Promise<CurrentUserResponse> => {
    return apiFetch<CurrentUserResponse>("/auth/me", {
      method: "GET",
      defaultError: "Failed to fetch user data",
    });
  },

  // Create patient account for existing service provider
  createPatientAccount: async (data: LoginRequest): Promise<LoginResponse> => {
    return apiFetch<LoginResponse>("/auth/create-patient-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      defaultError: "Failed to create patient account",
    });
  },

  // Get current user's primary address (doctor or patient)
  getAddress: async (): Promise<Address | null> => {
    return apiFetch<Address | null>("/auth/address", {
      method: "GET",
      defaultError: "Failed to fetch address",
    });
  },

  // Create or update current user's primary address
  upsertAddress: async (
    data: Partial<
      Pick<
        Address,
        | "address_line1"
        | "address_line2"
        | "city"
        | "state"
        | "postal_code"
        | "country_code"
        | "label"
      >
    >
  ): Promise<Address> => {
    return apiFetch<Address>("/auth/address", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      defaultError: "Failed to update address",
    });
  },
};

// Doctor Profile Types
export interface Specialty {
  id: number;
  nucc_code: string;
  value: string;
  label: string;
  description?: string | null;
}

export interface DoctorSpecialty {
  id: number;
  doctor_user_id: number;
  specialty_id: number;
  is_primary: boolean;
  specialty: Specialty;
}

export interface DoctorProfile {
  id: number;
  user_id: number;
  specialty: string;
  bio?: string;
  photo_url?: string;
  cover_photo_url?: string;
  years_of_experience?: number;
  medical_license_number?: string;
  board_certifications?: string[];
  languages_spoken?: string[];
  accepting_new_patients: boolean;
  offers_virtual_visits: boolean;
  created_at: string;
  updated_at?: string;
  specialties?: DoctorSpecialty[];
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
  social_links: DoctorSocialLink[];
  specialties?: DoctorSpecialty[];
}

export interface DoctorProfileUpdate {
  specialty?: string;
  bio?: string;
  photo_url?: string;
  cover_photo_url?: string;
  years_of_experience?: number;
  medical_license_number?: string;
  board_certifications?: string[];
  languages_spoken?: string[];
  accepting_new_patients?: boolean;
  offers_virtual_visits?: boolean;
}

export interface UserInfoUpdate {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  phone?: string;
  emergency_contact?: string;
}

export interface ClinicLocation {
  address_id: number;
  label?: string | null;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  place_id?: string | null;
  is_primary: boolean;
  distance_km?: number | null;
}

export interface DoctorListItem {
  id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email: string;
  phone?: string | null;
  specialty?: string | null;
  specialties?: string[];
  bio?: string | null;
  photo_url?: string | null;
  years_of_experience?: number | null;
  languages_spoken: string[];
  board_certifications: string[];
  accepting_new_patients: boolean;
  offers_virtual_visits: boolean;
  cover_photo_url?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  place_id?: string | null;
  google_rating?: number | null;
  google_user_ratings_total?: number | null;
  distance_km?: number | null;
  clinics?: ClinicLocation[];
}

export interface DoctorSocialLink {
  id: number;
  doctor_profile_id: number;
  platform: string;
  url: string;
  display_label?: string | null;
  is_visible: boolean;
  display_order?: number | null;
  created_at: string;
  updated_at: string;
}

export interface DoctorSocialLinkCreatePayload {
  platform: string;
  url: string;
  display_label?: string;
  is_visible?: boolean;
  display_order?: number;
}

export interface DoctorSocialLinkUpdatePayload {
  platform?: string;
  url?: string;
  display_label?: string;
  is_visible?: boolean;
  display_order?: number;
}

export interface AppointmentDoctor {
  id: number;
  name: string;
  specialty: string;
}

export interface Appointment {
  id: number;
  patient_user_id: number | null;
  doctor_user_id: number | null;
  clinic_id?: number | null;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status?: string | null;
  category?: string | null;
  location?: string | null;
  is_all_day: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  doctor?: AppointmentDoctor | null;
}

export interface HolidayEvent {
  id?: string;
  summary?: string;
  description?: string;
  start?: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  end?: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  location?: string;
}

export interface CalendarEventsResponse {
  appointments: Appointment[];
  holidays: HolidayEvent[];
  service_events: HolidayEvent[];
}

export interface CreateAppointmentRequest {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  category?: string;
  location?: string;
  is_all_day?: boolean;
  patient_user_id?: number;
  doctor_user_id?: number;
  clinic_id?: number;
  status?: string;
}

// Doctor API Functions
export const doctorAPI = {
  // List doctors for discovery
  listDoctors: async (
    params?: {
      search?: string;
      specialty?: string;
      patient_latitude?: number;
      patient_longitude?: number;
    }
  ): Promise<DoctorListItem[]> => {
    const query = new URLSearchParams();
    if (params?.search) {
      query.append("search", params.search);
    }
    if (params?.specialty && params.specialty !== "All Specialties") {
      query.append("specialty", params.specialty);
    }
    if (params?.patient_latitude !== undefined) {
      query.append("patient_latitude", params.patient_latitude.toString());
    }
    if (params?.patient_longitude !== undefined) {
      query.append("patient_longitude", params.patient_longitude.toString());
    }

    const path = query.toString() ? `/doctors?${query.toString()}` : "/doctors";
    return apiFetch<DoctorListItem[]>(path, {
      method: "GET",
      defaultError: "Failed to fetch doctors",
    });
  },

  listSpecialties: async (): Promise<Specialty[]> => {
    return apiFetch<Specialty[]>("/doctors/specialties", {
      method: "GET",
      defaultError: "Failed to fetch specialties",
    });
  },

  // Get doctor profile
  getProfile: async (): Promise<DoctorProfileData> => {
    return apiFetch<DoctorProfileData>("/doctors/profile", {
      method: "GET",
      defaultError: "Failed to fetch doctor profile",
    });
  },

  // Update doctor profile
  updateProfile: async (
    data: DoctorProfileUpdate
  ): Promise<DoctorProfileData> => {
    return apiFetch<DoctorProfileData>("/doctors/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      defaultError: "Failed to update doctor profile",
    });
  },

  // Update user info
  updateUserInfo: async (data: UserInfoUpdate): Promise<DoctorProfileData> => {
    return apiFetch<DoctorProfileData>("/doctors/user-info", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      defaultError: "Failed to update user information",
    });
  },

  // Upload profile picture
  uploadProfilePicture: async (file: File): Promise<{ message: string; photo_url: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    return apiFetch<{ message: string; photo_url: string }>("/doctors/upload-profile-picture", {
      method: "POST",
      body: formData,
      defaultError: "Failed to upload profile picture",
    });
  },

  // Delete profile picture
  deleteProfilePicture: async (): Promise<{ message: string }> => {
    return apiFetch<{ message: string }>("/doctors/profile-picture", {
      method: "DELETE",
      defaultError: "Failed to delete profile picture",
    });
  },

  uploadCoverPhoto: async (file: File): Promise<{ message: string; cover_photo_url: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    return apiFetch<{ message: string; cover_photo_url: string }>("/doctors/upload-cover-photo", {
      method: "POST",
      body: formData,
      defaultError: "Failed to upload cover photo",
    });
  },

  deleteCoverPhoto: async (): Promise<{ message: string }> => {
    return apiFetch<{ message: string }>("/doctors/cover-photo", {
      method: "DELETE",
      defaultError: "Failed to delete cover photo",
    });
  },

  listSocialLinks: async (): Promise<DoctorSocialLink[]> => {
    return apiFetch<DoctorSocialLink[]>("/doctors/social-links", {
      method: "GET",
      defaultError: "Failed to fetch social links",
    });
  },

  createSocialLink: async (payload: DoctorSocialLinkCreatePayload): Promise<DoctorSocialLink> => {
    return apiFetch<DoctorSocialLink>("/doctors/social-links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      defaultError: "Failed to create social link",
    });
  },

  updateSocialLink: async (linkId: number, payload: DoctorSocialLinkUpdatePayload): Promise<DoctorSocialLink> => {
    return apiFetch<DoctorSocialLink>(`/doctors/social-links/${linkId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      defaultError: "Failed to update social link",
    });
  },

  deleteSocialLink: async (linkId: number): Promise<void> => {
    await apiFetch<void>(`/doctors/social-links/${linkId}`, {
      method: "DELETE",
      expectJson: false,
      defaultError: "Failed to delete social link",
    });
  },

  listClinics: async (): Promise<Address[]> => {
    return apiFetch<Address[]>("/doctors/clinics", {
      method: "GET",
      defaultError: "Failed to fetch clinics",
    });
  },

  createClinic: async (payload: Partial<Pick<Address, "address_line1" | "address_line2" | "city" | "state" | "postal_code" | "country_code" | "label">>): Promise<Address> => {
    return apiFetch<Address>("/doctors/clinics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      defaultError: "Failed to create clinic",
    });
  },

  updateClinic: async (clinicId: number, payload: Partial<Pick<Address, "address_line1" | "address_line2" | "city" | "state" | "postal_code" | "country_code" | "label">>): Promise<Address> => {
    return apiFetch<Address>(`/doctors/clinics/${clinicId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      defaultError: "Failed to update clinic",
    });
  },

  deleteClinic: async (clinicId: number): Promise<void> => {
    await apiFetch<void>(`/doctors/clinics/${clinicId}`, {
      method: "DELETE",
      expectJson: false,
      defaultError: "Failed to delete clinic",
    });
  },

  setPrimaryClinic: async (clinicId: number): Promise<Address> => {
    return apiFetch<Address>(`/doctors/clinics/${clinicId}/set-primary`, {
      method: "PUT",
      defaultError: "Failed to set primary clinic",
    });
  },

  getMySpecialties: async (): Promise<DoctorSpecialty[]> => {
    return apiFetch<DoctorSpecialty[]>("/doctors/my-specialties", {
      method: "GET",
      defaultError: "Failed to fetch doctor specialties",
    });
  },

  addSpecialty: async (specialtyId: number, isPrimary: boolean = false): Promise<DoctorSpecialty> => {
    const query = new URLSearchParams();
    query.append("specialty_id", specialtyId.toString());
    query.append("is_primary", isPrimary.toString());
    return apiFetch<DoctorSpecialty>(`/doctors/specialties?${query.toString()}`, {
      method: "POST",
      defaultError: "Failed to add specialty",
    });
  },

  removeSpecialty: async (specialtyId: number): Promise<void> => {
    await apiFetch<void>(`/doctors/specialties/${specialtyId}`, {
      method: "DELETE",
      expectJson: false,
      defaultError: "Failed to remove specialty",
    });
  },

  setPrimarySpecialty: async (specialtyId: number): Promise<DoctorSpecialty> => {
    return apiFetch<DoctorSpecialty>(`/doctors/specialties/${specialtyId}/set-primary`, {
      method: "PUT",
      defaultError: "Failed to set primary specialty",
    });
  },

  updateSpecialties: async (specialtyIds: number[], primarySpecialtyId?: number): Promise<DoctorSpecialty[]> => {
    return apiFetch<DoctorSpecialty[]>("/doctors/specialties", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        specialty_ids: specialtyIds,
        primary_specialty_id: primarySpecialtyId,
      }),
      defaultError: "Failed to update specialties",
    });
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

    const path = query.toString()
      ? `/calendar/google/events?${query.toString()}`
      : "/calendar/google/events";

    return apiFetch<CalendarEventsResponse>(path, {
      method: "GET",
      defaultError: "Failed to fetch calendar events",
    });
  },

  createAppointment: async (
    payload: CreateAppointmentRequest
  ): Promise<Appointment> => {
    return apiFetch<Appointment>("/calendar/google/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      defaultError: "Failed to create appointment",
    });
  },

  getUpcomingAppointments: async (limit: number = 5): Promise<Appointment[]> => {
    const now = new Date();
    const timeMin = now.toISOString();
    // Get appointments for the next 3 months
    const timeMax = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const response = await calendarAPI.listEvents({
      timeMin,
      timeMax,
      includeHolidays: false,
      maxResults: limit,
    });

    // Filter to only scheduled/confirmed appointments and sort by start_time
    return response.appointments
      .filter((apt) => apt.status === "scheduled" || apt.status === "confirmed")
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, limit);
  },
};

export interface AppointmentRequest {
  request_id: number;
  patient_user_id: number;
  doctor_user_id: number;
  clinic_id?: number | null;
  preferred_date: string;
  preferred_time_slot_start: string;
  is_flexible: boolean;
  status: string;
  reason?: string | null;
  notes?: string | null;
  suggested_date?: string | null;
  suggested_time_slot_start?: string | null;
  appointment_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentRequestCreate {
  doctor_user_id: number;
  clinic_id?: number;
  preferred_date: string;
  preferred_time_slot_start: string;
  is_flexible: boolean;
  reason?: string;
  notes?: string;
}

export interface AppointmentRequestUpdate {
  status?: string;
  suggested_date?: string;
  suggested_time_slot_start?: string;
  notes?: string;
}

export interface Notification {
  notification_id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  status: string;
  related_entity_type?: string | null;
  related_entity_id?: number | null;
  appointment_request_id?: number | null;
  appointment_id?: number | null;
  notification_metadata?: Record<string, any> | null;
  created_at: string;
  read_at?: string | null;
  archived_at?: string | null;
}

export const appointmentRequestAPI = {
  create: async (data: AppointmentRequestCreate): Promise<AppointmentRequest> => {
    return apiFetch<AppointmentRequest>("/appointment-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      defaultError: "Failed to create appointment request",
    });
  },

  listForPatient: async (status?: string): Promise<AppointmentRequest[]> => {
    const query = status ? `?status=${status}` : "";
    return apiFetch<AppointmentRequest[]>(`/appointment-requests/patient${query}`, {
      method: "GET",
      defaultError: "Failed to fetch appointment requests",
    });
  },

  listForDoctor: async (status?: string): Promise<AppointmentRequest[]> => {
    const query = status ? `?status=${status}` : "";
    return apiFetch<AppointmentRequest[]>(`/appointment-requests/doctor${query}`, {
      method: "GET",
      defaultError: "Failed to fetch appointment requests",
    });
  },

  get: async (requestId: number): Promise<AppointmentRequest> => {
    return apiFetch<AppointmentRequest>(`/appointment-requests/${requestId}`, {
      method: "GET",
      defaultError: "Failed to fetch appointment request",
    });
  },

  update: async (requestId: number, data: AppointmentRequestUpdate): Promise<AppointmentRequest> => {
    return apiFetch<AppointmentRequest>(`/appointment-requests/${requestId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      defaultError: "Failed to update appointment request",
    });
  },
};

export interface DoctorDashboardStats {
  completed_appointments: number;
  upcoming_appointments: number;
  pending_requests: number;
  total_appointments_this_week: number;
  cancelled_appointments_this_week: number;
  reschedule_requests: number;
  unique_patients_this_week: number;
}

export const doctorDashboardAPI = {
  getStats: async (): Promise<DoctorDashboardStats> => {
    return apiFetch<DoctorDashboardStats>("/doctors/dashboard/stats", {
      method: "GET",
      defaultError: "Failed to fetch dashboard statistics",
    });
  },
};

export const notificationAPI = {
  list: async (params?: { status?: string; limit?: number; offset?: number }): Promise<Notification[]> => {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.offset) query.append("offset", params.offset.toString());

    const path = query.toString() ? `/notifications?${query.toString()}` : "/notifications";
    return apiFetch<Notification[]>(path, {
      method: "GET",
      defaultError: "Failed to fetch notifications",
    });
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    return apiFetch<{ count: number }>("/notifications/unread/count", {
      method: "GET",
      defaultError: "Failed to fetch unread count",
    });
  },

  get: async (notificationId: number): Promise<Notification> => {
    return apiFetch<Notification>(`/notifications/${notificationId}`, {
      method: "GET",
      defaultError: "Failed to fetch notification",
    });
  },

  markAsRead: async (notificationId: number): Promise<Notification> => {
    return apiFetch<Notification>(`/notifications/${notificationId}/read`, {
      method: "PATCH",
      defaultError: "Failed to mark notification as read",
    });
  },

  markAllAsRead: async (): Promise<{ count: number }> => {
    return apiFetch<{ count: number }>("/notifications/read-all", {
      method: "POST",
      defaultError: "Failed to mark all notifications as read",
    });
  },

  archive: async (notificationId: number): Promise<Notification> => {
    return apiFetch<Notification>(`/notifications/${notificationId}/archive`, {
      method: "PATCH",
      defaultError: "Failed to archive notification",
    });
  },
};

