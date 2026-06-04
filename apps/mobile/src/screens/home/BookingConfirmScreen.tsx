import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { getMe } from "../../api/http";
import { AppScreen } from "../../components/ui/AppScreen";
import { BookingStepper } from "../../components/ui/BookingStepper";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { MediaPlaceholder } from "../../components/ui/MediaPlaceholder";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Text } from "../../components/ui/Text";
import { getServiceCategoryLabel } from "../../discovery/categoryMetadata";
import { useCityState } from "../../hooks/useCityState";
import type { HomeStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../state/authStore";
import { useTheme } from "../../theme/theme";

export default function BookingConfirmScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, "BookingConfirm">>();
  const { service, date, time } = route.params;
  const categoryLabel = getServiceCategoryLabel(service);
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

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.borderSoft,
      color: theme.colors.textPrimary,
    },
  ];

  const bookingSteps = [
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "details", label: "Details" },
    { key: "pay", label: "Pay" },
  ];

  return (
    <AppScreen
      scrollable
      stickyFooter={
        <View style={styles.footerContent}>
          <Button
            label="Continue to Review & Pay"
            variant="gold"
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
        <BookingStepper steps={bookingSteps} currentIndex={2} />

        <Card variant="marketplace" style={styles.heroCard}>
          <MediaPlaceholder
            compact
            categorySlug={service.category_slug}
            label="Confirm details"
            caption={service.name}
            style={styles.heroMedia}
          />
          <View style={styles.heroCopy}>
            <SectionHeader
              eyebrow="Pickup details"
              title="Confirm your care appointment"
              subtitle="Add the contact and address details your provider needs for pickup."
            />
            <View style={styles.badgeRow}>
              {categoryLabel ? <StatusBadge label={categoryLabel} tone="primary" /> : null}
              <StatusBadge label="Pickup" tone="warning" />
            </View>
          </View>
        </Card>

        <Card variant="marketplace">
          <View style={styles.cardHeader}>
            <SectionHeader title="Selected service" />
            <StatusBadge label="Pickup" tone="primary" />
          </View>
          <View style={styles.summaryRows}>
            {summary.map((row) => (
              <View key={row.label} style={styles.row}>
                <Text color={theme.colors.textMuted}>{row.label}</Text>
                <Text weight="bold" style={styles.rowValue}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <Card variant="marketplace">
          <SectionHeader title="Your details" subtitle="Used for pickup updates and appointment communication." />
          <View style={styles.formFields}>
            <TextInput placeholder="Full name" value={name} onChangeText={setName} style={inputStyle} placeholderTextColor={theme.colors.textSubtle} />
            <TextInput
              placeholder="Phone"
              value={phone}
              onChangeText={setPhone}
              style={inputStyle}
              placeholderTextColor={theme.colors.textSubtle}
              keyboardType="phone-pad"
            />
            <TextInput
              placeholder="Email (optional)"
              value={customerEmail}
              onChangeText={setCustomerEmail}
              style={inputStyle}
              placeholderTextColor={theme.colors.textSubtle}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </Card>

        <Card variant="marketplace">
          <SectionHeader title="Service address" subtitle="Where the provider should meet you." />
          <View style={styles.formFields}>
            <TextInput placeholder="Address line 1" value={addressLine1} onChangeText={setAddressLine1} style={inputStyle} placeholderTextColor={theme.colors.textSubtle} />
            <TextInput placeholder="Address line 2 (optional)" value={addressLine2} onChangeText={setAddressLine2} style={inputStyle} placeholderTextColor={theme.colors.textSubtle} />
            <TextInput placeholder="City" value={city} onChangeText={setCity} style={inputStyle} placeholderTextColor={theme.colors.textSubtle} />
            <TextInput
              placeholder="State"
              value={state}
              onChangeText={setState}
              style={inputStyle}
              placeholderTextColor={theme.colors.textSubtle}
              autoCapitalize="characters"
              maxLength={2}
            />
            <TextInput
              placeholder="Postal code"
              value={postalCode}
              onChangeText={setPostalCode}
              style={inputStyle}
              placeholderTextColor={theme.colors.textSubtle}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </Card>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 140,
    gap: 14,
  },
  footerContent: {
    flexDirection: "row",
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
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cardHeader: {
    gap: 12,
  },
  summaryRows: {
    marginTop: 12,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  rowValue: {
    flex: 1,
    textAlign: "right",
  },
  formFields: {
    marginTop: 14,
    gap: 12,
  },
  input: {
    minHeight: 52,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
});
