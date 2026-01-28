export interface Service {
  id: string;
  name: string;
  price: number;
  durationMins: number;
  category: string;
  rating?: number;
  imageUrl?: string;
}

export type AppointmentStatus = "confirmed" | "in_progress" | "completed";

export interface Appointment {
  id: string;
  customerName: string;
  serviceName: string;
  timeISO: string;
  distanceMiles: number;
  status: AppointmentStatus;
  claimedByMe?: boolean;
}
