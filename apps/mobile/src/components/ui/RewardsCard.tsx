import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { useTheme } from "../../theme/theme";
import { Text } from "./Text";

type RewardsCardProps = {
  title?: string;
  subtitle?: string;
  value?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Decorative membership/rewards-style surface for existing profile/account
 * content. It does not imply new backend rewards behavior.
 */
export function RewardsCard({
  title = "ShoeInn Care Club",
  subtitle = "Premium care, pickup, and delivery",
  value = "Member",
  style,
}: RewardsCardProps) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.primary, borderColor: `${theme.colors.accent}55` }, theme.shadows.floating, style]}>
      <View style={styles.topRow}>
        <View style={[styles.iconPlate, { backgroundColor: "rgba(255,255,255,0.16)" }]}>
          <Ionicons name="sparkles-outline" size={22} color={theme.colors.surfaceElevated} />
        </View>
        <View style={[styles.goldPill, { backgroundColor: theme.colors.accent }]}>
          <Text variant="meta" weight="bold" style={{ color: theme.colors.textPrimary }}>
            {value}
          </Text>
        </View>
      </View>
      <View>
        <Text variant="h2" weight="bold" style={{ color: theme.colors.surfaceElevated }}>
          {title}
        </Text>
        <Text color="rgba(255,255,255,0.78)" style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.rails}>
        <View style={[styles.rail, { backgroundColor: "rgba(255,255,255,0.22)" }]} />
        <View style={[styles.railShort, { backgroundColor: "rgba(255,255,255,0.14)" }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 168,
    borderRadius: 32,
    borderWidth: 1,
    padding: 18,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  iconPlate: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  goldPill: {
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    marginTop: 6,
  },
  rails: {
    gap: 8,
  },
  rail: {
    height: 5,
    borderRadius: 999,
    width: "100%",
  },
  railShort: {
    height: 5,
    borderRadius: 999,
    width: "58%",
  },
});

export default RewardsCard;
