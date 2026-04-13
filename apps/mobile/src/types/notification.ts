export interface NotificationPayload {
  [key: string]: any;
}

export interface Notification {
  id: string;
  company_id: string;
  appointment_id?: string | null;
  kind: string;
  channel: string;
  target?: string | null;
  payload: NotificationPayload;
  status: string;
  delivered: boolean;
  delivered_at?: string | null;
  read_at?: string | null;
  created_at: string;
}
