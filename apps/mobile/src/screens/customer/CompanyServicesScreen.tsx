import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import ServicesListScreen from "../ServicesListScreen";
import type { CustomerFlowStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../state/authStore";
import { useBooking } from "../../state/bookingStore";
import { useCompanyStore } from "../../state/companyStore";

export default function CompanyServicesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CustomerFlowStackParamList, "CompanyServices">>();
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const clearCompany = useCompanyStore((s) => s.clearSelectedCompany);
  const { setService, setDate, setStartTime, setHold, setAppointment, setStep } = useBooking();
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!selectedCompany) {
      navigation.navigate("CompanyPicker");
    }
  }, [navigation, selectedCompany]);

  useEffect(() => {
    const handleLogout = async () => {
      setService(undefined);
      setDate(undefined);
      setStartTime(undefined);
      setHold(undefined);
      setAppointment(undefined);
      clearCompany();
      await logout();
    };

    navigation.setOptions({
      title: selectedCompany ? selectedCompany.name : "Services",
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} accessibilityRole="button" style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Logout</Text>
        </TouchableOpacity>
      ),
    });
  }, [clearCompany, logout, navigation, selectedCompany, setAppointment, setDate, setHold, setService, setStartTime]);

  if (!selectedCompany) {
    return (
      <View style={styles.center}>
        <Text>Choose a provider to see services.</Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("CompanyPicker")}
        >
          <Text style={styles.secondaryText}>Back to providers</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>{selectedCompany.name}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => {
            clearCompany();
            navigation.navigate("CompanyPicker");
          }}
        >
          <Text style={styles.link}>Change provider</Text>
        </TouchableOpacity>
      </View>
      <ServicesListScreen
        companyId={selectedCompany.id}
        onSelect={(service) => {
          setService(service);
          setDate(undefined);
          setStartTime(undefined);
          setHold(undefined);
          setAppointment(undefined);
          setStep("detail");
          navigation.navigate("Booking");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
  },
  link: {
    color: "#2563eb",
    fontWeight: "700",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  secondaryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
  },
  secondaryText: {
    color: "#111827",
    fontWeight: "600",
  },
  headerButton: {
    padding: 6,
  },
  headerButtonText: {
    color: "#2563eb",
    fontWeight: "700",
  },
});
