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
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.tealSecondary : theme.colors.surfaceLight,
          borderColor: selected ? theme.colors.tealSecondary : theme.colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <Text weight="semibold" style={{ color: selected ? theme.colors.surfaceLight : theme.colors.textCharcoal }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
  },
});

export default CategoryChip;
