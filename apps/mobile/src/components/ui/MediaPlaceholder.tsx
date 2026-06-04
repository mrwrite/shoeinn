import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { getMarketplaceVisual } from "../../discovery/marketplaceVisuals";
import { useTheme } from "../../theme/theme";
import { Text } from "./Text";

type MediaPlaceholderProps = {
  categorySlug?: string | null;
  iconName?: keyof typeof Ionicons.glyphMap;
  label?: string;
  caption?: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Category-aware media surface for cards that do not yet have production
 * photography. Use this in place of empty gray image boxes.
 */
export function MediaPlaceholder({ categorySlug, iconName, label, caption, compact = false, style }: MediaPlaceholderProps) {
  const theme = useTheme();
  const visual = getMarketplaceVisual(categorySlug);
  const resolvedIcon = iconName ?? (visual.iconName as keyof typeof Ionicons.glyphMap);

  return (
    <View
      accessibilityLabel={label ? `${label} visual` : "Care service visual"}
      style={[
        styles.container,
        compact ? styles.compact : styles.default,
        { backgroundColor: visual.backgroundColor },
        style,
      ]}
    >
      <View style={[styles.accentRail, { backgroundColor: visual.accentColor }]} />
      <View style={[styles.orbit, styles.orbitLarge, { borderColor: "rgba(255,255,255,0.14)" }]} />
      <View style={[styles.orbit, styles.orbitSmall, { borderColor: "rgba(255,255,255,0.12)" }]} />
      <View style={[styles.iconPlate, { backgroundColor: "rgba(255,255,255,0.16)" }]}>
        <Ionicons name={resolvedIcon} size={compact ? 22 : 30} color={visual.foregroundColor} />
      </View>
      {label ? (
        <Text variant={compact ? "caption" : "h3"} weight="bold" numberOfLines={2} style={{ color: theme.colors.surfaceElevated }}>
          {label}
        </Text>
      ) : null}
      {caption ? (
        <Text variant="caption" numberOfLines={1} style={{ color: "rgba(255,255,255,0.78)" }}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    justifyContent: "flex-end",
    gap: 8,
  },
  default: {
    minHeight: 150,
    borderRadius: 28,
    padding: 16,
  },
  compact: {
    minHeight: 96,
    borderRadius: 22,
    padding: 12,
  },
  accentRail: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 52,
    height: 7,
    borderRadius: 999,
  },
  iconPlate: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  orbit: {
    position: "absolute",
    borderWidth: 1,
    borderRadius: 999,
  },
  orbitLarge: {
    width: 150,
    height: 150,
    right: -44,
    bottom: -42,
  },
  orbitSmall: {
    width: 84,
    height: 84,
    right: 42,
    top: -24,
  },
});

export default MediaPlaceholder;
