import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Text } from "../../components/ui/Text";
import { useAuthStore } from "../../state/authStore";
import { useTheme } from "../../theme/theme";

export default function ProfileScreen() {
  const theme = useTheme();
  const { fullName, email, role, logout } = useAuthStore();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surfaceLight, padding: 16, gap: 12 }}>
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
          Preferences
        </Text>
        <Text color={theme.colors.mutedText} style={{ marginTop: 6 }}>
          Peacock theme enabled. All data fetched live from API.
        </Text>
      </Card>
      <Button label="Logout" variant="secondary" onPress={logout} />
    </View>
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
});

