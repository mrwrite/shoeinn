import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, ViewStyle } from "react-native";

import { useTheme } from "../../theme/theme";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "ghost";

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  style?: ViewStyle;
};

export function Button({ label, onPress, disabled, loading, variant = "primary", style }: Props) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const background = {
    primary: theme.colors.peacockPrimary,
    secondary: theme.colors.surfaceLight,
    ghost: "transparent",
  }[variant];

  const borderColor = variant === "secondary" ? theme.colors.border : "transparent";
  const textColor = variant === "primary" ? theme.colors.surfaceLight : theme.colors.textCharcoal;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: background, borderColor, opacity: pressed ? 0.92 : 1 },
        variant === "secondary" && { borderWidth: 1 },
        variant === "ghost" && { paddingHorizontal: 0 },
        isDisabled && { opacity: 0.6 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text weight="semibold" style={{ color: textColor }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 8,
  },
});

export default Button;
