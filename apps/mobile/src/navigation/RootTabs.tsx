import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AppointmentDetailScreen from "../screens/appointments/AppointmentDetailScreen";
import AppointmentListScreen from "../screens/appointments/AppointmentListScreen";
import BookingConfirmScreen from "../screens/home/BookingConfirmScreen";
import BookingDateScreen from "../screens/home/BookingDateScreen";
import BookingTimeScreen from "../screens/home/BookingTimeScreen";
import HomeScreen from "../screens/home/HomeScreen";
import ServiceDetailScreen from "../screens/home/ServiceDetailScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import ProviderAppointmentDetailScreen from "../screens/provider/ProviderAppointmentDetailScreen";
import ProviderDashboardScreen from "../screens/provider/ProviderDashboardScreen";
import { useAuthStore } from "../state/authStore";
import { useTheme } from "../theme/theme";
import type { AppointmentSummary, Service } from "../types/booking";
import type { ProviderAppointment } from "../types/company";

export type HomeStackParamList = {
  Home: undefined;
  ServiceDetail: { service: Service };
  BookingDate: { service: Service };
  BookingTime: { service: Service; date: string };
  BookingConfirm: { service: Service; date: string; time: string };
};

export type AppointmentStackParamList = {
  AppointmentList: undefined;
  AppointmentDetail: { appointmentId: string; summary?: AppointmentSummary };
};

export type ProviderStackParamList = {
  ProviderDashboard: undefined;
  ProviderAppointmentDetail: { appointment: ProviderAppointment };
};

export type ProfileStackParamList = {
  Profile: undefined;
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const AppointmentStack = createNativeStackNavigator<AppointmentStackParamList>();
const ProviderStack = createNativeStackNavigator<ProviderStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator();

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
      <HomeStack.Screen name="BookingDate" component={BookingDateScreen} />
      <HomeStack.Screen name="BookingTime" component={BookingTimeScreen} />
      <HomeStack.Screen name="BookingConfirm" component={BookingConfirmScreen} />
    </HomeStack.Navigator>
  );
}

function AppointmentNavigator() {
  return (
    <AppointmentStack.Navigator>
      <AppointmentStack.Screen name="AppointmentList" component={AppointmentListScreen} options={{ headerShown: false }} />
      <AppointmentStack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: "Appointment" }} />
    </AppointmentStack.Navigator>
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
        options={{ title: "Job" }}
      />
    </ProviderStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    </ProfileStack.Navigator>
  );
}

export default function RootTabs() {
  const theme = useTheme();
  const role = useAuthStore((s) => s.role);
  const showProviderTab = ["provider", "company", "company_admin"].includes(role ?? "");

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.peacockPrimary,
        tabBarInactiveTintColor: theme.colors.mutedText,
        tabBarStyle: { paddingBottom: 6, height: 62 },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            HomeTab: "home",
            Appointments: "calendar",
            Provider: "briefcase",
            Profile: "person",
          };
          const key = iconMap[route.name] ?? "ellipse-outline";
          return <Ionicons name={key} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeNavigator} options={{ title: "Home" }} />
      <Tab.Screen
        name="Appointments"
        component={AppointmentNavigator}
        options={{ title: "Appointments" }}
      />
      {showProviderTab ? (
        <Tab.Screen name="Provider" component={ProviderNavigator} options={{ title: "Jobs" }} />
      ) : null}
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}
