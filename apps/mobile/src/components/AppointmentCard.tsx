import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { Appointment } from "../types/models";
import { useTheme } from "../theme/theme";
import { PrimaryButton } from "./PrimaryButton";

interface Props {
  appointment: Appointment;
  onClaim?: (appointment: Appointment) => void;
  onPress?: (appointment: Appointment) => void;
}

export function AppointmentCard({ appointment, onClaim, onPress }: Props) {
  const theme = useTheme();
  const isClaimed = appointment.claimedByMe;

  return (
    <Pressable style={[styles.card, theme.shadows.card]} onPress={() => onPress?.(appointment)}>
      <View style={styles.header}>
        <Text style={styles.name}>{appointment.customerName}</Text>
        <Text style={[styles.status, { color: theme.colors.tealSecondary }]}>{appointment.status.replace("_", " ")}</Text>
      </View>
      <Text style={styles.service}>{appointment.serviceName}</Text>
      <View style={styles.metaRow}>
        <Meta icon="time-outline" label={new Date(appointment.timeISO).toLocaleString()} />
        <Meta icon="navigate-outline" label={`${appointment.distanceMiles} mi`} />
      </View>
      <PrimaryButton
        label={isClaimed ? "Claimed" : "Claim Appointment"}
        disabled={isClaimed}
        onPress={() => onClaim?.(appointment)}
        style={styles.button}
      />
    </Pressable>
  );
}

function Meta({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={16} color={theme.colors.mutedText} />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2933",
  },
  status: {
    fontSize: 13,
    fontWeight: "600",
  },
  service: {
    marginTop: 4,
    color: "#6B7280",
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 10,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 14,
  },
  metaText: {
    marginLeft: 6,
    color: "#4B5563",
  },
  button: {
    marginTop: 4,
  },
});

export default AppointmentCard;
