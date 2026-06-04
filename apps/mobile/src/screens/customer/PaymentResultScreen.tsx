import React, { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";

import { getAppointment, refreshAppointmentPayment } from "../../api/http";
import { AppScreen } from "../../components/ui/AppScreen";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { LoadingState } from "../../components/ui/LoadingState";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Text } from "../../components/ui/Text";
import type { AppointmentStackParamList } from "../../navigation/types";
import { appointmentQueryKey, customerAppointmentsQueryKey } from "../../query/keys";
import { useTheme } from "../../theme/theme";

type Props = NativeStackScreenProps<AppointmentStackParamList, "PaymentResult">;

type LoadState =
  | { kind: "loading" }
  | { kind: "loaded"; appointment: Awaited<ReturnType<typeof getAppointment>> }
  | { kind: "error"; message: string };

function formatMoney(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null || !currency) {
    return "--";
  }
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export default function PaymentResultScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { bookingId, sessionId, status } = route.params;
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const appointment =
          status === "success"
            ? await refreshAppointmentPayment(bookingId)
            : await getAppointment(bookingId);
        if (!active) {
          return;
        }
        queryClient.setQueryData(appointmentQueryKey(bookingId), appointment);
        await queryClient.invalidateQueries({ queryKey: customerAppointmentsQueryKey });
        setState({ kind: "loaded", appointment });
      } catch (error: any) {
        if (!active) {
          return;
        }
        setState({ kind: "error", message: error?.message ?? "Unable to verify payment right now." });
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [bookingId, queryClient, status]);

  const appointment = state.kind === "loaded" ? state.appointment : null;
  const statusTitle = useMemo(() => {
    if (status === "cancel") {
      return "Payment canceled";
    }
    if (appointment?.payment_status === "succeeded") {
      return "Payment confirmed";
    }
    if (appointment?.payment_status === "failed") {
      return "Payment needs attention";
    }
    return "Verifying payment";
  }, [appointment?.payment_status, status]);

  const statusBody = useMemo(() => {
    if (status === "cancel") {
      return "No payment was completed. You can reopen checkout or review this booking.";
    }
    return (
      appointment?.payment_message ??
      "We're checking Stripe for the latest payment result for this booking."
    );
  }, [appointment?.payment_message, status]);

  const tone = status === "cancel" ? "warning" : appointment?.payment_status === "failed" ? "danger" : appointment?.payment_status === "succeeded" ? "success" : "primary";
  const icon = tone === "success" ? "checkmark-circle" : tone === "danger" ? "alert-circle" : "time-outline";

  const openAppointment = () => {
    navigation.replace("AppointmentDetail", {
      appointmentId: bookingId,
      refreshPaymentOnOpen: false,
      paymentReturnStatus: status,
    });
  };

  return (
    <AppScreen contentContainerStyle={styles.container}>
      <Card variant="marketplace" style={styles.hero}>
        <View style={[styles.iconBubble, { backgroundColor: tone === "success" ? theme.colors.successSoft : theme.colors.accentSoft }]}>
          <Ionicons name={icon} size={34} color={tone === "success" ? theme.colors.success : theme.colors.primary} />
        </View>
        <SectionHeader title={statusTitle} subtitle={statusBody} style={styles.header} />
        <StatusBadge label={status === "cancel" ? "Checkout canceled" : appointment?.payment_status ?? "Verifying"} tone={tone} />
      </Card>

      <Card variant="marketplace" style={styles.card}>
        <Text variant="caption" weight="bold" color={theme.colors.textMuted}>
          Booking
        </Text>
        <Text color={theme.colors.textSecondary} style={styles.mono}>
          {bookingId}
        </Text>

        {sessionId ? (
          <View style={styles.sessionBlock}>
            <Text variant="caption" weight="bold" color={theme.colors.textMuted}>
              Stripe session
            </Text>
            <Text color={theme.colors.textSecondary} style={styles.mono}>
              {sessionId}
            </Text>
          </View>
        ) : null}

        {state.kind === "loading" ? <LoadingState label="Verifying latest payment status" /> : null}

        {state.kind === "error" ? (
          <View style={[styles.errorBlock, { backgroundColor: theme.colors.dangerSoft, borderColor: `${theme.colors.danger}33` }]}>
            <Text color={theme.colors.danger} weight="bold">
              {state.message}
            </Text>
          </View>
        ) : null}

        {appointment ? (
          <View style={styles.summary}>
            <SummaryRow label="Payment status" value={appointment.payment_status ?? "pending"} />
            <SummaryRow label="Booking status" value={appointment.status} />
            <SummaryRow
              label="Amount"
              value={formatMoney(
                appointment.payment_amount_received ?? appointment.payment_amount_expected,
                appointment.payment_currency,
              )}
            />
          </View>
        ) : null}
      </Card>

      <View style={styles.actions}>
        <Button
          label={status === "cancel" ? "Back to booking payment" : "View booking status"}
          variant="gold"
          onPress={openAppointment}
        />
        <Button
          label={status === "success" ? "Refresh payment status" : "Review appointment"}
          variant="secondary"
          onPress={() => {
            if (status === "success") {
              void (async () => {
                try {
                  const latest = await refreshAppointmentPayment(bookingId);
                  queryClient.setQueryData(appointmentQueryKey(bookingId), latest);
                  await queryClient.invalidateQueries({ queryKey: customerAppointmentsQueryKey });
                  setState({ kind: "loaded", appointment: latest });
                } catch (error: any) {
                  Alert.alert("Unable to refresh", error?.message ?? "Please try again.");
                }
              })();
              return;
            }
            openAppointment();
          }}
        />
      </View>
    </AppScreen>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.summaryRow}>
      <Text color={theme.colors.textMuted}>{label}</Text>
      <Text weight="bold" style={styles.summaryValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 16,
    justifyContent: "center",
  },
  hero: {
    alignItems: "center",
    gap: 12,
    padding: 22,
  },
  iconBubble: {
    width: 72,
    height: 72,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
  },
  card: {
    gap: 10,
  },
  mono: {
    fontSize: 13,
  },
  sessionBlock: {
    marginTop: 4,
    gap: 4,
  },
  errorBlock: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  summary: {
    marginTop: 8,
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryValue: {
    flex: 1,
    textAlign: "right",
  },
  actions: {
    gap: 10,
  },
});
