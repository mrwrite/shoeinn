import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type { Appointment, AppointmentHold, Service } from "../types/booking";

export type BookingStep =
  | "services"
  | "detail"
  | "schedule"
  | "customer"
  | "confirmation";

interface BookingState {
  selectedService?: Service;
  selectedDate?: string;
  selectedStartTime?: string;
  hold?: AppointmentHold;
  appointment?: Appointment;
  step: BookingStep;
}

interface BookingActions {
  setStep: (step: BookingStep) => void;
  setService: (service: Service | undefined) => void;
  setDate: (date: string | undefined) => void;
  setStartTime: (start: string | undefined) => void;
  setHold: (hold: AppointmentHold | undefined) => void;
  setAppointment: (appointment: Appointment | undefined) => void;
  reset: () => void;
}

export type BookingContextValue = BookingState & BookingActions;

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

const initialState: BookingState = {
  step: "services",
};

export function BookingProvider({ children }: PropsWithChildren<unknown>) {
  const [state, setState] = useState<BookingState>(initialState);

  const actions = useMemo<BookingActions>(
    () => ({
      setStep(step) {
        setState((prev) => ({ ...prev, step }));
      },
      setService(service) {
        console.log("[Services] Selected service", service?.name ?? "none");
        setState((prev) => ({
          ...prev,
          selectedService: service,
        }));
      },
      setDate(date) {
        setState((prev) => ({
          ...prev,
          selectedDate: date,
        }));
      },
      setStartTime(start) {
        setState((prev) => ({
          ...prev,
          selectedStartTime: start,
        }));
      },
      setHold(hold) {
        setState((prev) => ({
          ...prev,
          hold,
        }));
      },
      setAppointment(appointment) {
        setState((prev) => ({
          ...prev,
          appointment,
        }));
      },
      reset() {
        setState(initialState);
      },
    }),
    [],
  );

  const value = useMemo<BookingContextValue>(
    () => ({
      ...state,
      ...actions,
    }),
    [state, actions],
  );

  return React.createElement(
    BookingContext.Provider,
    { value },
    children,
  );
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error("useBooking must be used within BookingProvider");
  }
  return ctx;
}
