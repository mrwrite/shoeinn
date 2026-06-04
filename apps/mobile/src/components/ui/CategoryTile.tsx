import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { getMarketplaceVisual } from "../../discovery/marketplaceVisuals";
import { useTheme } from "../../theme/theme";
import { Text } from "./Text";

type CategoryTileProps = {
  label: string;
  categorySlug?: string | null;
  iconName?: keyof typeof Ionicons.glyphMap;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Luxury category tile for marketplace discovery. It is presentational only;
 * callers own selected category state and filtering behavior.
 */
export function CategoryTile({ label, categorySlug, iconName, selected = false, onPress, style }: CategoryTileProps) {
  const theme = useTheme();
  const visual = getMarketplaceVisual(categorySlug);
  const resolvedIcon = iconName ?? (visual.iconName as keyof typeof Ionicons.glyphMap);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${label}`}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: selected ? visual.backgroundColor : theme.colors.surfaceElevated,
          borderColor: selected ? visual.backgroundColor : theme.colors.borderSoft,
          opacity: pressed ? 0.92 : 1,
        },
        !selected && theme.shadows.soft,
        style,
      ]}
    >
      <View style={[styles.iconPlate, { backgroundColor: selected ? "rgba(255,255,255,0.16)" : visual.softColor }]}>
        <Ionicons name={resolvedIcon} size={22} color={selected ? visual.foregroundColor : visual.backgroundColor} />
      </View>
      <Text
        variant="caption"
        weight="bold"
        numberOfLines={2}
        style={{ color: selected ? theme.colors.surfaceElevated : theme.colors.textPrimary }}
      >
        {label}
      </Text>
      <View style={[styles.accent, { backgroundColor: selected ? visual.accentColor : theme.colors.accentSoft }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 120,
    minHeight: 112,
    borderRadius: 26,
    borderWidth: 1,
    padding: 12,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  iconPlate: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  accent: {
    width: 42,
    height: 5,
    borderRadius: 999,
  },
});

export default CategoryTile;
