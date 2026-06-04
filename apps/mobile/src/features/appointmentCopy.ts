export const customerAppointmentStatusLabels: Record<string, string> = {
  requested: "Requested",
  pending_payment: "Pending payment",
  payment_failed: "Payment failed",
  confirmed: "Confirmed",
  en_route: "En route",
  en_route_pickup: "En route to pickup",
  picked_up: "Picked up",
  in_progress: "In progress",
  cleaning: "In care",
  ready: "Ready for return",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const customerAppointmentNextStepCopy: Record<string, string> = {
  requested: "Your appointment request has been received.",
  pending_payment: "Payment is required before the booking can be confirmed.",
  payment_failed: "Payment did not complete. You can retry checkout or place a new booking.",
  confirmed: "A provider can now prepare for pickup.",
  en_route_pickup: "Your provider is on the way to pick up your order.",
  picked_up: "Your items are with the provider.",
  cleaning: "Your items are currently in care.",
  ready: "Your order is ready for return.",
  out_for_delivery: "Your provider is bringing your order back to you.",
  delivered: "Your order has been delivered.",
  completed: "Everything for this appointment is complete.",
  cancelled: "This appointment was cancelled.",
};

export function getReadableAppointmentStatus(status: string): string {
  return customerAppointmentStatusLabels[status] ?? status.replace(/_/g, " ");
}
