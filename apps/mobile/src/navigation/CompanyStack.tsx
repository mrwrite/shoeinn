import React from "react";
import { Pressable, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProviderAppointmentDetailScreen from "../screens/company/ProviderAppointmentDetailScreen";
import ProviderDashboardScreen from "../screens/company/ProviderDashboardScreen";
import NotificationsScreen from "../screens/company/NotificationsScreen";
import CompanyAdminUsersScreen from "../screens/company/CompanyAdminUsersScreen";
import type { ProviderAppointment } from "../types/company";
import { useAuthStore } from "../state/authStore";

export type CompanyStackParamList = {
  ProviderDashboard: undefined;
  ProviderAppointmentDetail: { appointment: ProviderAppointment };
  Notifications: undefined;
  CompanyAdminUsers: undefined;
};

const Stack = createNativeStackNavigator<CompanyStackParamList>();

export default function CompanyStack() {
  const role = useAuthStore((s) => s.role);

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProviderDashboard"
        component={ProviderDashboardScreen}
        options={({ navigation }) => ({
          title: "Open appointments",
          headerRight:
            role === "company_admin"
              ? () => (
                  <Pressable onPress={() => navigation.navigate("CompanyAdminUsers")}> 
                    <Text style={{ color: "#111827", fontWeight: "600" }}>Team</Text>
                  </Pressable>
                )
              : undefined,
        })}
      />
      <Stack.Screen
        name="ProviderAppointmentDetail"
        component={ProviderAppointmentDetailScreen}
        options={{ title: "Appointment" }}
      />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
      <Stack.Screen name="CompanyAdminUsers" component={CompanyAdminUsersScreen} options={{ title: "Team" }} />
    </Stack.Navigator>
  );
}
