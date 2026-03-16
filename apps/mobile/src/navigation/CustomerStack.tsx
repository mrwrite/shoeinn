import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BookingScreen from "../screens/customer/BookingScreen";
import CompanyPickerScreen from "../screens/customer/CompanyPickerScreen";
import CompanyServicesScreen from "../screens/customer/CompanyServicesScreen";
import AppointmentDetailScreen from "../screens/customer/AppointmentDetailScreen";
import MyAppointmentsScreen from "../screens/customer/MyAppointmentsScreen";
import { BookingProvider } from "../state/bookingStore";
import type { CustomerFlowStackParamList } from "./types";

export type CustomerStackParamList = CustomerFlowStackParamList;

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export default function CustomerStack() {
  return (
    <BookingProvider>
      <Stack.Navigator initialRouteName="MyAppointments">
        <Stack.Screen name="MyAppointments" component={MyAppointmentsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: "Appointment" }} />
        <Stack.Screen name="CompanyPicker" component={CompanyPickerScreen} options={{ headerShown: true }} />
        <Stack.Screen name="CompanyServices" component={CompanyServicesScreen} options={{ headerShown: true }} />
        <Stack.Screen name="Booking" component={BookingScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </BookingProvider>
  );
}
