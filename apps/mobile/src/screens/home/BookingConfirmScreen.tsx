import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { getMe } from "../../api/http";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Text } from "../../components/ui/Text";
import { useCityState } from "../../hooks/useCityState";
import type { HomeStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../state/authStore";
import { useTheme } from "../../theme/theme";

export default function BookingConfirmScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, "BookingConfirm">>();
  const { service, date, time } = route.params;
  const { fullName, email } = useAuthStore();
  const [name, setName] = useState(fullName ?? "");
  const [phone, setPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState(email ?? "");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
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
      } catch {
        // Non-blocking local prefill only.
      }
    };
    void loadProfile();
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
  }, [detectedState, state]);

  const summary = useMemo(
    () => [
      { label: "Service", value: service.name },
      {
        label: "When",
        value: `${new Date(date).toDateString()} at ${new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      },
      { label: "Duration", value: `${service.duration_minutes} mins` },
    ],
    [date, service, time],
  );

  const disabled =
    !name.trim() ||
    !phone.trim() ||
    !addressLine1.trim() ||
    !city.trim() ||
    !state.trim() ||
    !postalCode.trim();

  return (
    <ScreenContainer
      scrollable
      stickyFooter={
        <View style={styles.footerContent}>
          <Button
            label="Continue to Review & Pay"
            disabled={disabled}
            onPress={() =>
              navigation.navigate("BookingReviewPay", {
                service,
                date,
                time,
                customerDetails: {
                  customer_name: name.trim(),
                  customer_phone: phone.trim(),
                  customer_email: customerEmail.trim() || undefined,
                  address_line1: addressLine1.trim(),
                  address_line2: addressLine2.trim() || undefined,
                  city: city.trim(),
                  state: state.trim(),
                  postal_code: postalCode.trim(),
                  type: "pickup",
                },
              })
            }
            style={{ flex: 1 }}
          />
        </View>
      }
    >
      <View style={styles.content}>
        <Text variant="title" weight="bold">
          Booking details
        </Text>

        <Card>
          <Text variant="subtitle" weight="semibold">
            Selected service
          </Text>
          <View style={{ marginTop: 10, gap: 8 }}>
            {summary.map((row) => (
              <View key={row.label} style={styles.row}>
                <Text color={theme.colors.mutedText}>{row.label}</Text>
                <Text weight="semibold">{row.value}</Text>
              </View>
            ))}
          </View>
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
