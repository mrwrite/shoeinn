import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppointmentDetailScreen from "../screens/customer/AppointmentDetailScreen";
import CustomerNotificationsScreen from "../screens/customer/CustomerNotificationsScreen";
import PaymentResultScreen from "../screens/customer/PaymentResultScreen";
import AppointmentListScreen from "../screens/appointments/AppointmentListScreen";
import BookingConfirmScreen from "../screens/home/BookingConfirmScreen";
import BookingDateScreen from "../screens/home/BookingDateScreen";
import BookingReviewPayScreen from "../screens/home/BookingReviewPayScreen";
import BookingTimeScreen from "../screens/home/BookingTimeScreen";
import HomeScreen from "../screens/home/HomeScreen";
import ProviderMenuScreen from "../screens/home/ProviderMenuScreen";
import ServiceDetailScreen from "../screens/home/ServiceDetailScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import ProviderAppointmentDetailScreen from "../screens/provider/ProviderAppointmentDetailScreen";
import ProviderDashboardScreen from "../screens/provider/ProviderDashboardScreen";
import OwnerAppointmentDetailScreen from "../screens/owner/OwnerAppointmentDetailScreen";
import OwnerDashboardScreen from "../screens/owner/OwnerDashboardScreen";
import type {
  AppointmentStackParamList,
  HomeStackParamList,
  ProfileStackParamList,
  ProviderStackParamList,
  RootTabParamList,
} from "./types";
import { useAuthStore } from "../state/authStore";
import { useTheme } from "../theme/theme";
import { appointmentsTabOptions } from "./rootTabsOptions";

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
      <HomeStack.Screen
        name="BookingReviewPay"
        component={BookingReviewPayScreen}
        options={{ title: "Review & Pay" }}
      />
    </HomeStack.Navigator>
  );
}

function AppointmentNavigator() {
  return (
    <AppointmentStack.Navigator>
      <AppointmentStack.Screen name="AppointmentList" component={AppointmentListScreen} options={{ headerShown: false }} />
      <AppointmentStack.Screen name="PaymentResult" component={PaymentResultScreen} options={{ title: "Payment update" }} />
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
  const role = useAuthStore((state) => state.role);
  const isOwner = role === "company_admin";
  return (
    <ProviderStack.Navigator>
      <ProviderStack.Screen
        name="ProviderDashboard"
        component={isOwner ? OwnerDashboardScreen : ProviderDashboardScreen}
        options={{ headerShown: false }}
      />
      <ProviderStack.Screen
        name="ProviderAppointmentDetail"
        component={isOwner ? OwnerAppointmentDetailScreen : ProviderAppointmentDetailScreen}
        options={{ title: isOwner ? "Owner job view" : "Job" }}
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
  const usesOperationalHome = role === "provider" || role === "company_admin";
  const showProviderTab = role === "company";
  const homeTabComponent = usesOperationalHome ? ProviderNavigator : HomeNavigator;
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);
  const operationalShell = role === "provider" || role === "company_admin";

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: operationalShell ? theme.colors.accent : theme.colors.primary,
        tabBarInactiveTintColor: operationalShell ? "rgba(255,255,255,0.68)" : theme.colors.textSubtle,
        tabBarStyle: {
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: 68 + bottomPadding,
          backgroundColor: operationalShell ? "#062E37" : theme.colors.surfaceElevated,
          borderTopColor: operationalShell ? "rgba(255,255,255,0.08)" : theme.colors.borderSoft,
          borderTopWidth: 1,
          shadowColor: operationalShell ? "#000000" : "#1B1E24",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: operationalShell ? 0.2 : 0.08,
          shadowRadius: 20,
          elevation: 12,
        },
        tabBarItemStyle: {
          minHeight: 52,
        },
        tabBarLabelStyle: { paddingBottom: 4, fontWeight: "700", fontSize: 12, color: operationalShell ? "#F8F5EF" : undefined },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            HomeTab: "home",
            AppointmentsTab: "calendar",
            ProviderTab: "briefcase",
            ProfileTab: "person",
          };
          const key = iconMap[route.name] ?? "ellipse-outline";
          return <Ionicons name={key} size={size + 1} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={homeTabComponent} options={{ title: "Home" }} />
      {role === "customer" ? (
        <Tab.Screen
          name="AppointmentsTab"
          component={AppointmentNavigator}
          options={appointmentsTabOptions}
          listeners={({ navigation }) => ({
            tabPress: (event) => {
              event.preventDefault();
              navigation.navigate("AppointmentsTab", { screen: "AppointmentList" });
            },
          })}
        />
      ) : null}
      {showProviderTab ? (
        <Tab.Screen
          name="ProviderTab"
          component={ProviderNavigator}
          options={{ title: "Jobs" }}
        />
      ) : null}
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}
