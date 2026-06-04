import React, { useMemo, useState } from "react";
import { Alert, Linking, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { confirmAppointment, createHold, getAppointmentQuote } from "../../api/http";
import { AppScreen } from "../../components/ui/AppScreen";
import { BookingStepper } from "../../components/ui/BookingStepper";
import { LoadingState } from "../../components/ui/LoadingState";
import { MediaPlaceholder } from "../../components/ui/MediaPlaceholder";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Card, PressableCard } from "../../components/ui/Card";
import { Text } from "../../components/ui/Text";
import { getServiceCategoryLabel } from "../../discovery/categoryMetadata";
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
  const categoryLabel = getServiceCategoryLabel(service);

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
          icon: "card-outline" as const,
        },
        {
          key: "stripe_checkout" as const,
          title: "Add new card in secure checkout",
          detail: "Continue into Stripe-hosted checkout",
          icon: "lock-closed-outline" as const,
        },
        {
          key: "mock_demo" as const,
          title: "Demo payment method",
          detail: "Local mock payment for demos and development",
          icon: "sparkles-outline" as const,
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
  const bookingSteps = [
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "details", label: "Details" },
    { key: "pay", label: "Pay" },
  ];

  return (
    <AppScreen
      scrollable
      contentContainerStyle={styles.content}
      stickyFooter={
        <View style={styles.stickyFooter}>
          <View>
            <Text variant="caption" color={theme.colors.textMuted}>
              Total due
            </Text>
            <Text variant="h2" weight="bold">
              {totalLabel}
            </Text>
          </View>
          <Button
            label={placing ? "Placing booking..." : "Place booking"}
            variant="gold"
            onPress={() => placeBookingMutation.mutate()}
            loading={placing}
            disabled={placing || quoteQuery.isLoading || quoteQuery.isError}
            style={styles.footerButton}
          />
        </View>
      }
    >
        <BookingStepper steps={bookingSteps} currentIndex={3} />
        <SectionHeader
          eyebrow="Review & Pay"
          title="Confirm your order"
          subtitle="Review your pickup details, choose payment, and place the booking."
        />

        <Card variant="marketplace" style={styles.heroCard}>
          <MediaPlaceholder
            compact
            categorySlug={service.category_slug}
            label={service.name}
            caption={categoryLabel ?? "Care appointment"}
            style={styles.heroMedia}
          />
          <View style={styles.heroCopy}>
            <View style={styles.heroHeader}>
              <SectionHeader title={service.name} subtitle={`${new Date(date).toDateString()} at ${new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`} />
              <StatusBadge label="Ready to book" tone="primary" />
            </View>
            <View style={styles.badgeRow}>
              {categoryLabel ? <StatusBadge label={categoryLabel} tone="primary" /> : null}
              <StatusBadge label={totalLabel} tone="warning" />
            </View>
          </View>
        </Card>

        <Card variant="marketplace">
          <SectionHeader title="Payment summary" />
          {quoteQuery.isLoading ? (
            <LoadingState label="Loading checkout total" />
          ) : quoteQuery.isError ? (
            <View style={styles.errorBlock}>
              <Text color={theme.colors.danger} weight="bold">
                Unable to load the booking quote.
              </Text>
            </View>
          ) : (
            <View style={styles.summaryRows}>
              {quoteRows.map((row) => (
                <View key={row.key} style={styles.summaryRow}>
                  <Text color={row.key === "total" ? theme.colors.textPrimary : theme.colors.textMuted} weight={row.key === "total" ? "bold" : "regular"}>
                    {row.label}
                  </Text>
                  <Text weight={row.key === "total" ? "bold" : "semibold"}>{row.value}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card variant="marketplace">
          <SectionHeader title="Payment method" subtitle="Your final payment path depends on the active backend payment mode." />
          <View style={styles.paymentMethods}>
            {paymentOptions.map((option) => {
              const selected = paymentMethod === option.key;
              return (
                <PressableCard
                  key={option.key}
                  variant={selected ? "elevated" : "outline"}
                  style={[
                    styles.paymentMethodCard,
                    {
                      backgroundColor: selected ? theme.colors.surfaceTint : theme.colors.card,
                      borderColor: selected ? theme.colors.primary : theme.colors.borderSoft,
                    },
                  ]}
                  onPress={() => setPaymentMethod(option.key)}
                >
                  <View style={[styles.paymentIcon, { backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceMuted }]}>
                    <Ionicons name={option.icon} size={18} color={selected ? theme.colors.surfaceElevated : theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text weight="bold">{option.title}</Text>
                    <Text color={theme.colors.textSecondary} style={{ marginTop: 4 }}>
                      {option.detail}
                    </Text>
                  </View>
                </PressableCard>
              );
            })}
          </View>
        </Card>

        <Card variant="marketplace">
          <SectionHeader title="Pickup details" />
          <View style={styles.detailRows}>
            <Text weight="bold">{customerDetails.customer_name}</Text>
            <Text color={theme.colors.textSecondary}>{customerDetails.customer_phone}</Text>
            {customerDetails.customer_email ? (
              <Text color={theme.colors.textSecondary}>{customerDetails.customer_email}</Text>
            ) : null}
            <Text color={theme.colors.textSecondary}>
              {[customerDetails.address_line1, customerDetails.address_line2].filter(Boolean).join(", ")}
            </Text>
            <Text color={theme.colors.textSecondary}>
              {[customerDetails.city, customerDetails.state, customerDetails.postal_code].filter(Boolean).join(" ")}
            </Text>
          </View>
        </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 140,
    gap: 14,
  },
  heroCard: {
    padding: 0,
    overflow: "hidden",
  },
  heroMedia: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  heroCopy: {
    padding: 16,
    gap: 12,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
  errorBlock: {
    marginTop: 12,
  },
  paymentMethods: {
    marginTop: 12,
    gap: 10,
  },
  paymentMethodCard: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  detailRows: {
    marginTop: 12,
    gap: 6,
  },
  stickyFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 8,
    borderRadius: 18,
  },
  footerButton: {
    flex: 1,
  },
});
