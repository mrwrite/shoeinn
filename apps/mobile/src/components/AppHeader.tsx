import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../theme/theme";

interface AppHeaderProps {
  title?: string;
  locationLabel: string;
  onPressLocation?: () => void;
  onPressNotifications?: () => void;
}

export function AppHeader({ title, locationLabel, onPressLocation, onPressNotifications }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8, backgroundColor: theme.colors.surfaceLight }]}>
      <View style={styles.left}>
        <Text style={styles.title}>{title ?? "Explore"}</Text>
        <Text style={styles.location} onPress={onPressLocation}>
          <Ionicons name="location-outline" size={16} color={theme.colors.mutedText} /> {locationLabel}
        </Text>
      </View>
      <View style={styles.actions}>
        <Ionicons name="chevron-down" size={18} color={theme.colors.mutedText} onPress={onPressLocation} />
        <Ionicons
          name="notifications-outline"
          size={22}
          color={theme.colors.textCharcoal}
          style={styles.bell}
          onPress={onPressNotifications}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F4C5C",
  },
  location: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  bell: {
    marginLeft: 12,
  },
});

export default AppHeader;
