import { getReadableAppointmentStatus } from "./appointmentCopy";
import type { AppointmentStatus } from "../types/booking";
import type { ProviderAppointment } from "../types/company";
import type { AppointmentTimelineItem } from "../components/ui/AppointmentTimeline";

export type FeedbackTone = "success" | "warning" | "danger";

export type FeedbackState = {
  tone: FeedbackTone;
  message: string;
} | null;

const IN_PROGRESS_STATUSES = new Set(["en_route_pickup", "picked_up", "cleaning", "out_for_delivery"]);
const READY_STATUSES = new Set(["ready"]);

export function getClaimFeedback(error: Error): FeedbackState {
  const message = error.message.toLowerCase();
  if (
    message.includes("already assigned") ||
    message.includes("conflict") ||
    message.includes("no longer available") ||
    message.includes("409")
  ) {
    return {
      tone: "warning",
      message: "This job is no longer available. Refresh to see the latest list.",
    };
  }

  return {
    tone: "danger",
    message: "Unable to claim this job right now. Try again or refresh the list.",
  };
}

export function formatOperationalCue(appointments: ProviderAppointment[] | undefined, mode: "available" | "my") {
  if (!appointments || appointments.length === 0) {
    return mode === "available" ? "No claimable jobs are waiting right now." : "No active assigned jobs right now.";
  }

  const byTime = [...appointments].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  const earliest = byTime[0];

  if (mode === "available") {
    return `Next pickup window starts ${new Date(earliest.start_time).toLocaleString()}.`;
  }

  return `${earliest.service_name ?? "Appointment"} is next, currently ${earliest.status.replace(/_/g, " ")}.`;
}

export function buildProviderTimeline(status: AppointmentStatus): AppointmentTimelineItem[] {
  const statusOptions: AppointmentStatus[] = [
    "confirmed",
    "en_route_pickup",
    "picked_up",
    "cleaning",
    "ready",
    "out_for_delivery",
    "delivered",
    "completed",
    "cancelled",
  ];
  const currentIndex = statusOptions.indexOf(status);
  return statusOptions
    .filter((item) => (status === "cancelled" ? item === "cancelled" || statusOptions.indexOf(item) <= currentIndex : item !== "cancelled"))
    .map((item, index) => ({
      key: item,
      title: getReadableAppointmentStatus(item),
      detail: item === status ? "Current job state" : index < currentIndex ? "Completed" : "Next step",
      state: item === status && ["completed", "cancelled"].includes(item) ? "terminal" : item === status ? "current" : index < currentIndex ? "completed" : "upcoming",
    }));
}

export function getFilteredAppointments(items: ProviderAppointment[], filter: "unassigned" | "in_progress" | "ready" | "all") {
  switch (filter) {
    case "unassigned":
      return items.filter((item) => !item.provider_name && item.status === "confirmed");
    case "in_progress":
      return items.filter((item) => IN_PROGRESS_STATUSES.has(item.status));
    case "ready":
      return items.filter((item) => READY_STATUSES.has(item.status));
    default:
      return items;
  }
}

export function getNextActionLabel(item: ProviderAppointment) {
  if (!item.provider_name && item.status === "confirmed") return "Needs assignment";
  if (item.status === "ready") return "Ready to deliver";
  if (IN_PROGRESS_STATUSES.has(item.status)) return "In motion";
  return "Review job";
}

export function getEmphasis(item: ProviderAppointment): "priority" | "ready" | "active" | "neutral" {
  if (!item.provider_name && item.status === "confirmed") return "priority";
  if (item.status === "ready") return "ready";
  if (IN_PROGRESS_STATUSES.has(item.status)) return "active";
  return "neutral";
}
