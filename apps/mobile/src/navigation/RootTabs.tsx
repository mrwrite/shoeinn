import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import CustomerHomeScreen from "../screens/customer/CustomerHomeScreen";
import ServiceDetailScreen from "../screens/customer/ServiceDetailScreen";
import BookingDateScreen from "../screens/customer/BookingDateScreen";
import BookingTimeScreen from "../screens/customer/BookingTimeScreen";
import BookingConfirmScreen from "../screens/customer/BookingConfirmScreen";
import ProviderDashboardScreen from "../screens/provider/ProviderDashboardScreen";
import ProviderAppointmentDetailScreen from "../screens/provider/ProviderAppointmentDetailScreen";
import type { Appointment, Service } from "../types/models";
import { useTheme } from "../theme/theme";

export type CustomerStackParamList = {
  CustomerHome: undefined;
  ServiceDetail: { service: Service };
  BookingDate: { service: Service };
  BookingTime: { service: Service; date: string };
  BookingConfirm: { service: Service; date: string; time: string };
};

export type ProviderStackParamList = {
  ProviderDashboard: undefined;
  ProviderAppointmentDetail: { appointment: Appointment };
};

const CustomerStack = createNativeStackNavigator<CustomerStackParamList>();
const ProviderStack = createNativeStackNavigator<ProviderStackParamList>();
const Tab = createBottomTabNavigator();

function CustomerNavigator() {
  return (
    <CustomerStack.Navigator screenOptions={{ headerShown: false }}>
      <CustomerStack.Screen name="CustomerHome" component={CustomerHomeScreen} />
      <CustomerStack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
      <CustomerStack.Screen name="BookingDate" component={BookingDateScreen} />
      <CustomerStack.Screen name="BookingTime" component={BookingTimeScreen} />
      <CustomerStack.Screen name="BookingConfirm" component={BookingConfirmScreen} />
    </CustomerStack.Navigator>
  );
}

function ProviderNavigator() {
  return (
    <ProviderStack.Navigator>
      <ProviderStack.Screen
        name="ProviderDashboard"
        component={ProviderDashboardScreen}
        options={{ headerShown: false }}
      />
      <ProviderStack.Screen
        name="ProviderAppointmentDetail"
        component={ProviderAppointmentDetailScreen}
        options={{ title: "Appointment" }}
      />
    </ProviderStack.Navigator>
  );
}

export default function RootTabs() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.peacockPrimary,
        tabBarInactiveTintColor: theme.colors.mutedText,
        tabBarStyle: { paddingBottom: 6, height: 60 },
        tabBarIcon: ({ color, size }) => {
          const iconName = route.name === "Customer" ? "home" : "briefcase-outline";
          return <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Customer" component={CustomerNavigator} />
      <Tab.Screen name="Provider" component={ProviderNavigator} />
    </Tab.Navigator>
  );
}
