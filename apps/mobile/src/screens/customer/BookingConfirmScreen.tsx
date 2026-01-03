import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";

import { PrimaryButton, SecondaryButton } from "../../components/PrimaryButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import type { CustomerStackParamList } from "../../navigation/RootTabs";

export default function BookingConfirmScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<CustomerStackParamList, "BookingConfirm">>();
  const { service, date, time } = route.params;

  const onConfirm = () => {
    Alert.alert("Appointment confirmed", "Your booking is scheduled!", [
      {
        text: "Back to home",
        onPress: () => navigation.navigate("CustomerHome"),
      },
    ]);
  };

  return (
    <ScreenContainer>
      <View style={styles.section}>
        <Text style={styles.title}>Review & Confirm</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{service.name}</Text>
          <Text style={styles.summaryText}>${service.price.toFixed(2)} · {service.durationMins} mins</Text>
          <Text style={styles.summaryText}>{new Date(date).toDateString()} at {time}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Service Address</Text>
          <Text style={styles.summaryText}>123 Main Street, McDonough, GA</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Payment</Text>
          <Text style={styles.summaryText}>Visa •••• 4242</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <SecondaryButton label="Back" onPress={() => navigation.goBack()} style={{ marginRight: 12 }} />
        <PrimaryButton label="Confirm Appointment" onPress={onConfirm} style={{ flex: 1 }} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2933",
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2933",
    marginBottom: 4,
  },
  summaryText: {
    color: "#4B5563",
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
  },
});
