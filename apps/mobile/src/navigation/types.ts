import type { NavigatorScreenParams } from "@react-navigation/native";

import type { AppointmentSummary, BookingCustomerDetails, Service } from "../types/booking";
import type { Company, ProviderAppointment } from "../types/company";

export type HomeStackParamList = {
  Home: undefined;
  ProviderMenu: { company: Company; categorySlug?: string | null; categoryName?: string | null };
  ServiceDetail: { service: Service };
  BookingDate: { service: Service };
  BookingTime: { service: Service; date: string };
  BookingConfirm: { service: Service; date: string; time: string };
  BookingReviewPay: {
    service: Service;
    date: string;
    time: string;
    customerDetails: BookingCustomerDetails;
  };
};

export type AppointmentStackParamList = {
  AppointmentList: undefined;
  PaymentResult: {
    bookingId: string;
    sessionId?: string;
    status: "success" | "cancel";
  };
  AppointmentDetail: {
    appointmentId: string;
    summary?: AppointmentSummary;
    refreshPaymentOnOpen?: boolean;
    paymentReturnStatus?: "success" | "cancel";
  };
  CustomerNotifications: undefined;
};

export type CustomerFlowStackParamList = {
  MyAppointments: undefined;
  AppointmentDetail: { appointmentId: string; summary?: AppointmentSummary };
  CustomerNotifications: undefined;
  CompanyPicker: undefined;
  CompanyServices: undefined;
  Booking: undefined;
};

export type ProviderStackParamList = {
  ProviderDashboard: undefined;
  ProviderAppointmentDetail: { appointment: ProviderAppointment };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  CustomerNotifications: undefined;
};

export type RootTabParamList = {
  HomeTab:
    | NavigatorScreenParams<HomeStackParamList>
    | NavigatorScreenParams<ProviderStackParamList>
    | undefined;
  AppointmentsTab: NavigatorScreenParams<AppointmentStackParamList> | undefined;
  ProviderTab: NavigatorScreenParams<ProviderStackParamList> | undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined;
};
