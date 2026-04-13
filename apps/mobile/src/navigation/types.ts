import type { NavigatorScreenParams } from "@react-navigation/native";

import type { AppointmentSummary, Service } from "../types/booking";
import type { Company, ProviderAppointment } from "../types/company";

export type HomeStackParamList = {
  Home: undefined;
  ProviderMenu: { company: Company };
  ServiceDetail: { service: Service };
  BookingDate: { service: Service };
  BookingTime: { service: Service; date: string };
  BookingConfirm: { service: Service; date: string; time: string };
};

export type AppointmentStackParamList = {
  AppointmentList: undefined;
  AppointmentDetail: { appointmentId: string; summary?: AppointmentSummary };
  CustomerNotifications: undefined;
};

export type CustomerFlowStackParamList = {
  MyAppointments: undefined;
  AppointmentDetail: { appointmentId: string; summary?: AppointmentSummary };
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
  HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined;
  AppointmentsTab: NavigatorScreenParams<AppointmentStackParamList> | undefined;
  ProviderTab: NavigatorScreenParams<ProviderStackParamList> | undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined;
};
