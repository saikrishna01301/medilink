export interface UserSignupData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  role: "doctor" | "patient" | "insurer"; // Use a union type for Enum
  accepted_terms: boolean;
}

export interface UserLoginData {
  email_or_phone: string;
  password: string;
}
