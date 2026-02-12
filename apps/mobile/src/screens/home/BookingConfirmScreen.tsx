import React, { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, TextInput, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";

import { confirmAppointment, createHold, getMe } from "../../api/http";
import { useCityState } from "../../hooks/useCityState";
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
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [holdId, setHoldId] = useState<string | null>(null);
  const { city: detectedCity, state: detectedState } = useCityState();

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        const me = await getMe();
        if (!mounted) return;
        if (!name && me.full_name) setName(me.full_name);
        if (!customerEmail && me.email) setCustomerEmail(me.email);
        if (!addressLine1 && me.address_line1) setAddressLine1(me.address_line1);
        if (!addressLine2 && me.address_line2) setAddressLine2(me.address_line2);
        if (!city && me.city) setCity(me.city);
        if (!state && me.state) setState(me.state);
        if (!postalCode && me.postal_code) setPostalCode(me.postal_code);
      } catch (err) {
        // non-blocking prefill
      }
    };
    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!city && detectedCity) {
      setCity(detectedCity);
    }
  }, [city, detectedCity]);

  useEffect(() => {
    if (!state && detectedState) {
      setState(detectedState);
    }
  }, [state, detectedState]);

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const company = service.company_id ?? companyId;
      if (!company) throw new Error("Company missing");

      const hold = await createHold({
        service_id: service.id,
        start_time: time,
        company_id: company,
        customer_name: name,
        customer_phone: phone,
        customer_email: customerEmail || undefined,
        address_line1: addressLine1,
        address_line2: addressLine2 || undefined,
        city,
        state,
        postal_code: postalCode,
      });

      setHoldId(hold.id);

      return confirmAppointment({
        hold_id: hold.id,
        company_id: company,
        customer_name: name,
        customer_phone: phone,
        customer_email: customerEmail || undefined,
        address_line1: addressLine1,
        address_line2: addressLine2 || undefined,
        city,
        state,
        postal_code: postalCode,
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
  const disabled =
    !name.trim() ||
    !phone.trim() ||
    !addressLine1.trim() ||
    !city.trim() ||
    !state.trim() ||
    !postalCode.trim() ||
    confirmMutation.isPending;

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
          {holdId ? (
            <Text variant="caption" color={theme.colors.mutedText} style={{ marginTop: 8 }}>
              Slot reserved.
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
            Service address
          </Text>
          <View style={{ marginTop: 12, gap: 12 }}>
            <TextInput
              placeholder="Address line 1"
              value={addressLine1}
              onChangeText={setAddressLine1}
              style={[styles.input, { borderColor: theme.colors.border }]}
              placeholderTextColor={theme.colors.mutedText}
            />
            <TextInput
              placeholder="Address line 2 (optional)"
              value={addressLine2}
              onChangeText={setAddressLine2}
              style={[styles.input, { borderColor: theme.colors.border }]}
              placeholderTextColor={theme.colors.mutedText}
            />
            <TextInput
              placeholder="City"
              value={city}
              onChangeText={setCity}
              style={[styles.input, { borderColor: theme.colors.border }]}
              placeholderTextColor={theme.colors.mutedText}
            />
            <TextInput
              placeholder="State"
              value={state}
              onChangeText={setState}
              style={[styles.input, { borderColor: theme.colors.border }]}
              placeholderTextColor={theme.colors.mutedText}
              autoCapitalize="characters"
              maxLength={2}
            />
            <TextInput
              placeholder="Postal code"
              value={postalCode}
              onChangeText={setPostalCode}
              style={[styles.input, { borderColor: theme.colors.border }]}
              placeholderTextColor={theme.colors.mutedText}
              keyboardType="numbers-and-punctuation"
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
