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
    secondary: "#f8fafc",
    ghost: "transparent",
  }[variant];

  const borderColor =
    variant === "secondary" ? "#cbd5e1" : variant === "primary" ? "#0b3b48" : "transparent";
  const textColor = variant === "primary" ? theme.colors.surfaceLight : theme.colors.textCharcoal;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: background, borderColor, opacity: pressed ? 0.92 : 1 },
        variant === "primary" && styles.primary,
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
  primary: {
    borderWidth: 1,
    shadowColor: "#0F4C5C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
});

export default Button;
