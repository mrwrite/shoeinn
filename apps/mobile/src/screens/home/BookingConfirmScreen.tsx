import React, { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, TextInput, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";

import { confirmAppointment, createHold } from "../../api/http";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Text } from "../../components/ui/Text";
import type { HomeStackParamList } from "../../navigation/RootTabs";
import { useAuthStore } from "../../state/authStore";
import { useTheme } from "../../theme/theme";

export default function BookingConfirmScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, "BookingConfirm">>();
  const { service, date, time } = route.params;
  const { fullName, email, companyId } = useAuthStore();
  const [name, setName] = useState(fullName ?? "");
  const [phone, setPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState(email ?? "");
  const [holdId, setHoldId] = useState<string | null>(null);

  const holdMutation = useMutation({
    mutationFn: () =>
      createHold({
        service_id: service.id,
        start_time: time,
        company_id: service.company_id ?? companyId ?? undefined,
      }),
    onSuccess: (hold) => setHoldId(hold.id),
    onError: (err: Error) => Alert.alert("Hold failed", err.message),
  });

  useEffect(() => {
    holdMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmMutation = useMutation({
    mutationFn: () => {
      if (!holdId) throw new Error("Hold missing");
      return confirmAppointment({
        hold_id: holdId,
        company_id: service.company_id ?? companyId ?? "",
        customer_name: name,
        customer_phone: phone,
        customer_email: customerEmail || undefined,
      });
    },
    onSuccess: (appt) => {
      navigation.getParent()?.navigate("AppointmentsTab", {
        screen: "AppointmentDetail",
        params: { appointmentId: appt.id },
      } as never);
    },
    onError: (err: Error) => Alert.alert("Booking failed", err.message),
  });

  const summary = useMemo(
    () => [
      { label: "Service", value: service.name },
      { label: "When", value: `${new Date(date).toDateString()} at ${new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` },
      { label: "Duration", value: `${service.duration_minutes} mins` },
    ],
    [service, date, time],
  );

  const price = service.price_cents ? `$${(service.price_cents / 100).toFixed(2)}` : "Pricing";
  const disabled = !name || !phone || confirmMutation.isPending || !holdId;

  return (
    <ScreenContainer
      scrollable
      stickyFooter={
        <View style={styles.footerContent}>
          <Button
            label={confirmMutation.isPending ? "Confirming..." : "Confirm appointment"}
            onPress={() => confirmMutation.mutate()}
            disabled={disabled}
            loading={confirmMutation.isPending}
            style={{ flex: 1 }}
          />
        </View>
      }
    >
      <View style={styles.content}>
        <Text variant="title" weight="bold">
          Review & confirm
        </Text>

        <Card>
          <Text variant="subtitle" weight="semibold">
            Summary
          </Text>
          <View style={{ marginTop: 10, gap: 8 }}>
            {summary.map((row) => (
              <View key={row.label} style={styles.row}>
                <Text color={theme.colors.mutedText}>{row.label}</Text>
                <Text weight="semibold">{row.value}</Text>
              </View>
            ))}
            <View style={styles.row}>
              <Text color={theme.colors.mutedText}>Total</Text>
              <Text weight="bold" style={{ color: theme.colors.peacockPrimary }}>
                {price}
              </Text>
            </View>
          </View>
          {!holdId ? (
            <Text variant="caption" color={theme.colors.mutedText} style={{ marginTop: 8 }}>
              Reserving your slot...
            </Text>
          ) : null}
        </Card>

        <Card>
          <Text variant="subtitle" weight="semibold">
            Your details
          </Text>
          <View style={{ marginTop: 12, gap: 12 }}>
            <TextInput
              placeholder="Full name"
              value={name}
              onChangeText={setName}
              style={[styles.input, { borderColor: theme.colors.border }]}
              placeholderTextColor={theme.colors.mutedText}
            />
            <TextInput
              placeholder="Phone"
              value={phone}
              onChangeText={setPhone}
              style={[styles.input, { borderColor: theme.colors.border }]}
              placeholderTextColor={theme.colors.mutedText}
              keyboardType="phone-pad"
            />
            <TextInput
              placeholder="Email (optional)"
              value={customerEmail}
              onChangeText={setCustomerEmail}
              style={[styles.input, { borderColor: theme.colors.border }]}
              placeholderTextColor={theme.colors.mutedText}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </Card>

        <Card>
          <Text variant="subtitle" weight="semibold">
            Payment
          </Text>
          <Text color={theme.colors.mutedText} style={{ marginTop: 6 }}>
            Payment is processed after confirmation.
          </Text>
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 140,
    gap: 12,
  },
  footerContent: {
    backgroundColor: "#F8F9FA",
    padding: 8,
    borderRadius: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
  },
});
