import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProviderAppointmentDetailScreen from "../screens/company/ProviderAppointmentDetailScreen";
import ProviderDashboardScreen from "../screens/company/ProviderDashboardScreen";
import NotificationsScreen from "../screens/company/NotificationsScreen";
import type { ProviderAppointment } from "../types/company";

export type CompanyStackParamList = {
  ProviderDashboard: undefined;
  ProviderAppointmentDetail: { appointment: ProviderAppointment };
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<CompanyStackParamList>();

export default function CompanyStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProviderDashboard"
        component={ProviderDashboardScreen}
        options={{ title: "Open appointments" }}
      />
      <Stack.Screen
        name="ProviderAppointmentDetail"
        component={ProviderAppointmentDetailScreen}
        options={{ title: "Appointment" }}
      />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
    </Stack.Navigator>
  );
}
