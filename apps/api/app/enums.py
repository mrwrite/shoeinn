import enum

class AppointmentStatus(str, enum.Enum):
    requested = "requested"
    confirmed = "confirmed"
    picked_up = "picked_up"
    cleaning = "cleaning"
    ready = "ready"
    delivered = "delivered"
    completed = "completed"
    cancelled = "cancelled"
