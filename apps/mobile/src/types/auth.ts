export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  role: "customer" | "company" | "provider" | "company_admin";
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: "customer" | "company" | "provider" | "company_admin";
  user_id: string;
  company_id: string | null;
  full_name: string;
  email: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  full_name: string;
  role: string;
}
