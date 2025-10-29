// API Base URL - update this based on your backend configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// API Response types
export interface SignUpRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  role: "doctor" | "patient" | "insurer";
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
}

export interface LoginResponse {
  user_id: number;
  identifier: string;
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
};

