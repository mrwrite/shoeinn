import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppointmentDetailScreen from "../screens/customer/AppointmentDetailScreen";
import CustomerNotificationsScreen from "../screens/customer/CustomerNotificationsScreen";
import AppointmentListScreen from "../screens/appointments/AppointmentListScreen";
import BookingConfirmScreen from "../screens/home/BookingConfirmScreen";
import BookingDateScreen from "../screens/home/BookingDateScreen";
import BookingTimeScreen from "../screens/home/BookingTimeScreen";
import HomeScreen from "../screens/home/HomeScreen";
import ProviderMenuScreen from "../screens/home/ProviderMenuScreen";
import ServiceDetailScreen from "../screens/home/ServiceDetailScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import ProviderAppointmentDetailScreen from "../screens/provider/ProviderAppointmentDetailScreen";
import ProviderDashboardScreen from "../screens/provider/ProviderDashboardScreen";
import type {
  AppointmentStackParamList,
  HomeStackParamList,
  ProfileStackParamList,
  ProviderStackParamList,
  RootTabParamList,
} from "./types";
import { useAuthStore } from "../state/authStore";
import {
  getUnreadCustomerNotificationCount,
  useCustomerNotifications,
} from "../hooks/useCustomerNotifications";
import { useTheme } from "../theme/theme";

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const AppointmentStack = createNativeStackNavigator<AppointmentStackParamList>();
const ProviderStack = createNativeStackNavigator<ProviderStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const Tab = createBottomTabNavigator<RootTabParamList>();

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="ProviderMenu" component={ProviderMenuScreen} />
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
      <AppointmentStack.Screen
        name="CustomerNotifications"
        component={CustomerNotificationsScreen}
        options={{ title: "Notifications" }}
      />
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
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen
        name="CustomerNotifications"
        component={CustomerNotificationsScreen}
        options={{ title: "Notifications" }}
      />
    </ProfileStack.Navigator>
  );
}

export default function RootTabs() {
  const theme = useTheme();
  const role = useAuthStore((s) => s.role);
  const showProviderTab = ["provider", "company", "company_admin"].includes(role ?? "");
  const notificationsQuery = useCustomerNotifications(role === "customer");
  const unreadNotifications = getUnreadCustomerNotificationCount(notificationsQuery.data);
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.peacockPrimary,
        tabBarInactiveTintColor: theme.colors.mutedText,
        tabBarStyle: { paddingBottom: bottomPadding, height: 60 + bottomPadding },
        tabBarLabelStyle: { paddingBottom: 4 },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            HomeTab: "home",
            AppointmentsTab: "calendar",
            ProviderTab: "briefcase",
            ProfileTab: "person",
          };
          const key = iconMap[route.name] ?? "ellipse-outline";
          return <Ionicons name={key} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeNavigator} options={{ title: "Home" }} />
      {role === "customer" ? (
        <Tab.Screen
          name="AppointmentsTab"
          component={AppointmentNavigator}
          options={{
            title: "Appointments",
            tabBarBadge: unreadNotifications > 0 ? unreadNotifications : undefined,
          }}
        />
      ) : null}
      {showProviderTab ? (
        <Tab.Screen name="ProviderTab" component={ProviderNavigator} options={{ title: "Jobs" }} />
      ) : null}
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}
