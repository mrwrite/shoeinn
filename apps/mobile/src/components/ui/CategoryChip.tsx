import React from "react";
import { Pressable, StyleSheet } from "react-native";

import { useTheme } from "../../theme/theme";
import { Text } from "./Text";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function CategoryChip({ label, selected, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${label}`}
      accessibilityState={{ selected: Boolean(selected) }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceElevated,
          borderColor: selected ? theme.colors.primary : theme.colors.borderSoft,
          opacity: pressed ? 0.9 : 1,
        },
        !selected && theme.shadows.soft,
      ]}
    >
      <Text weight="semibold" style={{ color: selected ? theme.colors.surfaceElevated : theme.colors.textPrimary }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default CategoryChip;
