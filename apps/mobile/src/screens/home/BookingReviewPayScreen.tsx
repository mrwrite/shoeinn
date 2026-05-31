import React, { useMemo, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { confirmAppointment, createHold, getAppointmentQuote } from "../../api/http";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Text } from "../../components/ui/Text";
import { buildQuoteDisplayRows, formatMoney, getImmediateCheckoutUrl } from "../../features/bookingCheckout";
import type { HomeStackParamList } from "../../navigation/types";
import { appointmentQueryKey, customerAppointmentsQueryKey } from "../../query/keys";
import { useAuthStore } from "../../state/authStore";
import { useTheme } from "../../theme/theme";

type PaymentMethodOption = "saved_card" | "stripe_checkout" | "mock_demo";

export default function BookingReviewPayScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, "BookingReviewPay">>();
  const { service, date, time, customerDetails } = route.params;
  const { companyId } = useAuthStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodOption>("saved_card");
  const queryClient = useQueryClient();

  const quoteQuery = useQuery({
    queryKey: ["appointment-quote", service.id, time, customerDetails.type],
    queryFn: () =>
      getAppointmentQuote({
        service_id: service.id,
        start_time: time,
        type: customerDetails.type,
        address_line1: customerDetails.address_line1,
        address_line2: customerDetails.address_line2,
        city: customerDetails.city,
        state: customerDetails.state,
        postal_code: customerDetails.postal_code,
      }),
  });

  const placeBookingMutation = useMutation({
    mutationFn: async () => {
      const company = service.company_id ?? companyId;
      if (!company) {
        throw new Error("Company missing");
      }

      const hold = await createHold({
        service_id: service.id,
        start_time: time,
        company_id: company,
        type: customerDetails.type,
        customer_name: customerDetails.customer_name,
        customer_phone: customerDetails.customer_phone,
        customer_email: customerDetails.customer_email,
        address_line1: customerDetails.address_line1,
        address_line2: customerDetails.address_line2,
        city: customerDetails.city,
        state: customerDetails.state,
        postal_code: customerDetails.postal_code,
      });

      return confirmAppointment({
        hold_id: hold.id,
        company_id: company,
        customer_name: customerDetails.customer_name,
        customer_phone: customerDetails.customer_phone,
        customer_email: customerDetails.customer_email,
        type: customerDetails.type,
        address_line1: customerDetails.address_line1,
        address_line2: customerDetails.address_line2,
        city: customerDetails.city,
        state: customerDetails.state,
        postal_code: customerDetails.postal_code,
      });
    },
    onSuccess: async (appointment) => {
      console.log("[Booking] Confirm response", {
        id: appointment.id,
        status: appointment.status,
        payment_mode: appointment.payment_mode,
        payment_status: appointment.payment_status,
        has_checkout_url: Boolean(appointment.payment_checkout_url),
        payment_checkout_url: appointment.payment_checkout_url,
        selected_payment_method: paymentMethod,
      });
      queryClient.setQueryData(appointmentQueryKey(appointment.id), appointment);

      const navigateToAppointment = () => {
        navigation.getParent()?.navigate("AppointmentsTab", {
          screen: "AppointmentDetail",
          params: { appointmentId: appointment.id },
        } as never);
      };

      const checkoutUrl = getImmediateCheckoutUrl(appointment);
      if (checkoutUrl) {
        try {
          console.log("[Booking] Opening Stripe Checkout", checkoutUrl);
          await Linking.openURL(checkoutUrl);
        } catch (error) {
          console.warn("[Booking] Unable to open Stripe Checkout", error);
          Alert.alert("Checkout unavailable", "Unable to open Stripe checkout right now. Open this appointment to continue payment.");
        } finally {
          await queryClient.invalidateQueries({ queryKey: customerAppointmentsQueryKey });
          navigateToAppointment();
        }
        return;
      }

      if (appointment.payment_mode === "service" && paymentMethod === "stripe_checkout") {
        await queryClient.invalidateQueries({ queryKey: customerAppointmentsQueryKey });
        if (!checkoutUrl) {
          Alert.alert(
            "Checkout link missing",
            appointment.payment_message ?? "The booking was created, but Stripe Checkout was not returned. Open the appointment to check payment status or cancel the unpaid booking.",
          );
          navigateToAppointment();
          return;
        }
      }

      await queryClient.invalidateQueries({ queryKey: customerAppointmentsQueryKey });
      navigateToAppointment();
    },
    onError: (error: Error) => Alert.alert("Booking failed", error.message),
  });

  const paymentOptions = useMemo(
    () =>
      [
        {
          key: "saved_card" as const,
          title: "Visa ending in 4242",
          detail: "Saved/default card placeholder",
        },
        {
          key: "stripe_checkout" as const,
          title: "Add new card in secure checkout",
          detail: "Continue into Stripe-hosted checkout",
        },
        {
          key: "mock_demo" as const,
          title: "Demo payment method",
          detail: "Local mock payment for demos and development",
        },
      ].map((option) => ({
        ...option,
        disabled: option.key === "mock_demo" ? false : false,
      })),
    [],
  );

  const quoteRows = quoteQuery.data ? buildQuoteDisplayRows(quoteQuery.data) : [];
  const totalLabel = quoteQuery.data ? formatMoney(quoteQuery.data.total, quoteQuery.data.currency) : "--";
  const placing = placeBookingMutation.isPending;

  return (
    <ScreenContainer
      stickyFooter={
        <View style={styles.stickyFooter}>
          <View>
            <Text variant="caption" color={theme.colors.mutedText}>
              Total due
            </Text>
            <Text variant="title" weight="bold">
              {totalLabel}
            </Text>
          </View>
          <Button
            label={placing ? "Placing booking..." : "Place Booking"}
            onPress={() => placeBookingMutation.mutate()}
            loading={placing}
            disabled={placing || quoteQuery.isLoading || quoteQuery.isError}
            style={styles.footerButton}
          />
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="title" weight="bold">
          Review & Pay
        </Text>
        <Text color={theme.colors.mutedText}>
          Review the order summary, choose how to pay, and place the booking when ready.
        </Text>

        <Card style={styles.heroCard}>
          <Text variant="subtitle" weight="semibold">
            Order summary
          </Text>
          <Text color={theme.colors.mutedText} style={{ marginTop: 6 }}>
            {service.name}
          </Text>
          <Text style={styles.heroMeta}>
            {new Date(date).toDateString()} at {new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </Card>

        <Card>
          <Text variant="subtitle" weight="semibold">
            Payment summary
          </Text>
          {quoteQuery.isLoading ? (
            <Text color={theme.colors.mutedText} style={{ marginTop: 10 }}>
              Loading checkout total...
            </Text>
          ) : quoteQuery.isError ? (
            <Text color={theme.colors.danger} style={{ marginTop: 10 }}>
              Unable to load the booking quote.
            </Text>
          ) : (
            <View style={styles.summaryRows}>
              {quoteRows.map((row) => (
                <View key={row.key} style={styles.summaryRow}>
                  <Text color={row.key === "total" ? theme.colors.textCharcoal : theme.colors.mutedText} weight={row.key === "total" ? "bold" : "regular"}>
                    {row.label}
                  </Text>
                  <Text weight={row.key === "total" ? "bold" : "semibold"}>{row.value}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card>
          <Text variant="subtitle" weight="semibold">
            Payment method
          </Text>
          <View style={styles.paymentMethods}>
            {paymentOptions.map((option) => {
              const selected = paymentMethod === option.key;
              return (
                <Pressable
                  key={option.key}
                  style={[
                    styles.paymentMethodCard,
                    { borderColor: selected ? theme.colors.peacockPrimary : theme.colors.border },
                    selected && styles.paymentMethodCardSelected,
                  ]}
                  onPress={() => setPaymentMethod(option.key)}
                >
                  <Text weight="semibold">{option.title}</Text>
                  <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
                    {option.detail}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card>
          <Text variant="subtitle" weight="semibold">
            Delivery details
          </Text>
          <View style={{ marginTop: 10, gap: 6 }}>
            <Text weight="semibold">{customerDetails.customer_name}</Text>
            <Text color={theme.colors.mutedText}>{customerDetails.customer_phone}</Text>
            {customerDetails.customer_email ? (
              <Text color={theme.colors.mutedText}>{customerDetails.customer_email}</Text>
            ) : null}
            <Text color={theme.colors.mutedText}>
              {[customerDetails.address_line1, customerDetails.address_line2].filter(Boolean).join(", ")}
            </Text>
            <Text color={theme.colors.mutedText}>
              {[customerDetails.city, customerDetails.state, customerDetails.postal_code].filter(Boolean).join(" ")}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 140,
    gap: 12,
  },
  heroCard: {
    backgroundColor: "#fff7ed",
    borderColor: "#fdba74",
    borderWidth: 1,
  },
  heroMeta: {
    marginTop: 6,
    color: "#7c2d12",
  },
  summaryRows: {
    marginTop: 12,
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  paymentMethods: {
    marginTop: 12,
    gap: 10,
  },
  paymentMethodCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#ffffff",
  },
  paymentMethodCardSelected: {
    backgroundColor: "#eff6ff",
  },
  stickyFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 8,
    borderRadius: 18,
    backgroundColor: "#f8fafc",
  },
  footerButton: {
    flex: 1,
  },
});
