import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../theme/theme";
import type { AppointmentSummary } from "../types/booking";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Text } from "./ui/Text";

type Props = {
  appointment: AppointmentSummary;
  onPress?: (appointment: AppointmentSummary) => void;
  onClaim?: (appointment: AppointmentSummary) => void;
  claimable?: boolean;
};

const statusColors: Record<string, string> = {
  confirmed: "#1B998B",
  requested: "#0F4C5C",
  cleaning: "#E6AF2E",
  ready: "#2EC4B6",
  out_for_delivery: "#2EC4B6",
  delivered: "#1B998B",
  completed: "#059669",
  cancelled: "#9CA3AF",
};

export function AppointmentCard({ appointment, onPress, onClaim, claimable }: Props) {
  const theme = useTheme();
  const statusColor = statusColors[appointment.status] ?? theme.colors.mutedText;

  return (
    <Pressable onPress={() => onPress?.(appointment)} style={{ marginBottom: 12 }}>
      <Card>
        <View style={styles.header}>
          <View>
            <Text weight="semibold">{appointment.service_name ?? "Appointment"}</Text>
            <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
              {new Date(appointment.start_time).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: `${statusColor}22`, borderColor: statusColor }]}> 
            <Text weight="semibold" style={{ color: statusColor }}>
              {appointment.status.replace(/_/g, " ")}
            </Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="person" size={16} color={theme.colors.mutedText} />
            <Text style={{ marginLeft: 6 }} color={theme.colors.mutedText}>
              {appointment.customer_name}
            </Text>
          </View>
          {appointment.city ? (
            <View style={styles.metaItem}>
              <Ionicons name="location" size={16} color={theme.colors.mutedText} />
              <Text style={{ marginLeft: 6 }} color={theme.colors.mutedText}>
                {[appointment.city, appointment.state].filter(Boolean).join(", ")}
              </Text>
            </View>
          ) : null}
        </View>
        {claimable ? (
          <Button
            label="Claim appointment"
            onPress={() => onClaim?.(appointment)}
            style={{ marginTop: 12 }}
          />
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default AppointmentCard;
