export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  customer_push_enabled?: boolean;
  customer_push_assignment_updates?: boolean;
  customer_push_milestone_updates?: boolean;
}

export interface CustomerAddressUpdatePayload {
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
}

export interface NotificationPreferences {
  customer_push_enabled: boolean;
  customer_push_assignment_updates: boolean;
  customer_push_milestone_updates: boolean;
}
