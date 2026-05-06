import enum

class AppointmentStatus(str, enum.Enum):
    requested = "requested"
    pending_payment = "pending_payment"
    payment_failed = "payment_failed"
    confirmed = "confirmed"
    en_route_pickup = "en_route_pickup"
    picked_up = "picked_up"
    cleaning = "cleaning"
    ready = "ready"
    out_for_delivery = "out_for_delivery"
    delivered = "delivered"
    completed = "completed"
    cancelled = "cancelled"
