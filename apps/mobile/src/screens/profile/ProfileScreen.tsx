import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { getMe, updateMyAddress } from "../../api/http";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Text } from "../../components/ui/Text";
import { useAuthStore } from "../../state/authStore";
import { useTheme } from "../../theme/theme";

export default function ProfileScreen() {
  const theme = useTheme();
  const { fullName, email, role, logout } = useAuthStore();
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        const me = await getMe();
        if (!mounted) return;
        setAddressLine1(me.address_line1 ?? "");
        setAddressLine2(me.address_line2 ?? "");
        setCity(me.city ?? "");
        setState(me.state ?? "");
        setPostalCode(me.postal_code ?? "");
        setCountry(me.country ?? "US");
      } catch (err) {
        // ignore - profile basics still render from auth store
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const onSaveAddress = async () => {
    if (!addressLine1.trim() || !city.trim() || !state.trim() || !postalCode.trim()) {
      Alert.alert("Missing address", "Address line 1, city, state, and postal code are required.");
      return;
    }

    try {
      setSaving(true);
      await updateMyAddress({
        address_line1: addressLine1.trim(),
        address_line2: addressLine2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
        country: country.trim() || "US",
      });
      Alert.alert("Saved", "Address updated successfully.");
    } catch (err: any) {
      Alert.alert("Failed", err?.message ?? "Unable to update address.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text variant="title" weight="bold">
        Profile
      </Text>
      <Card style={styles.row}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={22} color={theme.colors.surfaceLight} />
        </View>
        <View style={{ flex: 1 }}>
          <Text weight="semibold">{fullName ?? "Guest"}</Text>
          <Text color={theme.colors.mutedText}>{email}</Text>
          <Text variant="caption" color={theme.colors.mutedText} style={{ marginTop: 4 }}>
            Role: {role ?? "unknown"}
          </Text>
        </View>
      </Card>
      <Card>
        <Text variant="subtitle" weight="semibold">
          Primary address
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
          />
          <TextInput
            placeholder="Postal code"
            value={postalCode}
            onChangeText={setPostalCode}
            style={[styles.input, { borderColor: theme.colors.border }]}
            placeholderTextColor={theme.colors.mutedText}
          />
          <TextInput
            placeholder="Country"
            value={country}
            onChangeText={setCountry}
            style={[styles.input, { borderColor: theme.colors.border }]}
            placeholderTextColor={theme.colors.mutedText}
            autoCapitalize="characters"
            maxLength={2}
          />
          <Button label={saving ? "Saving..." : "Save address"} onPress={onSaveAddress} loading={saving} disabled={saving} />
        </View>
      </Card>
      <Button label="Logout" variant="secondary" onPress={logout} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0F4C5C",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
  },
});
