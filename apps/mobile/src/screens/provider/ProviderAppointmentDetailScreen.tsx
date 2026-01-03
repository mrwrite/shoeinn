import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";

import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import type { ProviderStackParamList } from "../../navigation/RootTabs";
import type { AppointmentStatus } from "../../types/models";

const steps: AppointmentStatus[] = ["confirmed", "in_progress", "completed"];

export default function ProviderAppointmentDetailScreen() {
  const route = useRoute<RouteProp<ProviderStackParamList, "ProviderAppointmentDetail">>();
  const [appointment, setAppointment] = useState(route.params.appointment);

  const currentIndex = steps.indexOf(appointment.status);
  const nextStatus = steps[currentIndex + 1];

  const advance = () => {
    if (nextStatus) {
      setAppointment((prev) => ({ ...prev, status: nextStatus }));
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.section}>
        <Text style={styles.title}>{appointment.customerName}</Text>
        <Text style={styles.subtitle}>{appointment.serviceName}</Text>
        <Text style={styles.meta}>{new Date(appointment.timeISO).toLocaleString()}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.stepper}>
          {steps.map((step, index) => {
            const active = index <= currentIndex;
            return (
              <View key={step} style={styles.stepContainer}>
                <View style={[styles.dot, active && styles.dotActive]} />
                <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{step.replace("_", " ")}</Text>
                {index < steps.length - 1 ? <View style={[styles.line, active && styles.lineActive]} /> : null}
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.section}>
        {!appointment.claimedByMe && (
          <PrimaryButton label="Claim Appointment" onPress={() => setAppointment({ ...appointment, claimedByMe: true })} />
        )}
        {appointment.status === "confirmed" && appointment.claimedByMe ? (
          <PrimaryButton label="Start Job" onPress={advance} style={{ marginTop: 12 }} />
        ) : null}
        {appointment.status === "in_progress" ? (
          <PrimaryButton label="Complete Job" onPress={advance} style={{ marginTop: 12 }} />
        ) : null}
        {appointment.status === "completed" ? (
          <Pressable style={styles.completedBanner}>
            <Text style={styles.completedText}>Job Completed</Text>
          </Pressable>
        ) : null}
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
  },
  subtitle: {
    color: "#6B7280",
    marginTop: 4,
  },
  meta: {
    color: "#4B5563",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2933",
    marginBottom: 12,
  },
  stepper: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepContainer: {
    alignItems: "center",
    flex: 1,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E5E7EB",
  },
  dotActive: {
    backgroundColor: "#0F4C5C",
  },
  line: {
    height: 2,
    backgroundColor: "#E5E7EB",
    flex: 1,
    marginTop: 6,
  },
  lineActive: {
    backgroundColor: "#0F4C5C",
  },
  stepLabel: {
    marginTop: 8,
    color: "#6B7280",
    fontSize: 13,
    textTransform: "capitalize",
  },
  stepLabelActive: {
    color: "#0F4C5C",
    fontWeight: "700",
  },
  completedBanner: {
    backgroundColor: "#E6AF2E",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  completedText: {
    color: "#1F2933",
    fontWeight: "700",
  },
});
