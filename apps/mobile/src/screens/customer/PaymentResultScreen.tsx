import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";

import { getAppointment, refreshAppointmentPayment } from "../../api/http";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Text } from "../../components/ui/Text";
import type { AppointmentStackParamList } from "../../navigation/types";

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
        queryClient.setQueryData(["appointment", bookingId], appointment);
        await queryClient.invalidateQueries({ queryKey: ["appointments", "mine"] });
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
      "We’re checking Stripe for the latest payment result for this booking."
    );
  }, [appointment?.payment_message, status]);

  const openAppointment = () => {
    navigation.replace("AppointmentDetail", {
      appointmentId: bookingId,
      refreshPaymentOnOpen: false,
      paymentReturnStatus: status,
    });
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text variant="title" weight="bold">
          {statusTitle}
        </Text>
        <Text style={styles.subtitle}>{statusBody}</Text>
      </View>

      <View style={styles.card}>
        <Text weight="semibold">Booking</Text>
        <Text style={styles.mono}>{bookingId}</Text>
        {sessionId ? (
          <>
            <Text weight="semibold" style={styles.sectionLabel}>
              Stripe session
            </Text>
            <Text style={styles.mono}>{sessionId}</Text>
          </>
        ) : null}

        {state.kind === "loading" ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <Text>Verifying latest payment status…</Text>
          </View>
        ) : null}

        {state.kind === "error" ? (
          <Text style={styles.errorText}>{state.message}</Text>
        ) : null}

        {appointment ? (
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text>Payment status</Text>
              <Text weight="semibold">{appointment.payment_status ?? "pending"}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Booking status</Text>
              <Text weight="semibold">{appointment.status}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Amount</Text>
              <Text weight="semibold">
                {formatMoney(
                  appointment.payment_amount_received ?? appointment.payment_amount_expected,
                  appointment.payment_currency,
                )}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      <Pressable style={styles.primaryButton} onPress={openAppointment}>
        <Text style={styles.primaryText}>
          {status === "cancel" ? "Back to booking payment" : "View booking status"}
        </Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => {
          if (status === "success") {
            void (async () => {
              try {
                const latest = await refreshAppointmentPayment(bookingId);
                queryClient.setQueryData(["appointment", bookingId], latest);
                await queryClient.invalidateQueries({ queryKey: ["appointments", "mine"] });
                setState({ kind: "loaded", appointment: latest });
              } catch (error: any) {
                Alert.alert("Unable to refresh", error?.message ?? "Please try again.");
              }
            })();
            return;
          }
          openAppointment();
        }}
      >
        <Text style={styles.secondaryText}>
          {status === "success" ? "Refresh payment status" : "Review appointment"}
        </Text>
      </Pressable>
    </ScreenContainer>
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
    gap: 8,
  },
  subtitle: {
    color: "#4b5563",
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionLabel: {
    marginTop: 4,
  },
  mono: {
    color: "#334155",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 6,
  },
  summary: {
    marginTop: 8,
    gap: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  errorText: {
    color: "#b91c1c",
  },
  primaryButton: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryText: {
    color: "#0f172a",
    fontWeight: "600",
  },
});
