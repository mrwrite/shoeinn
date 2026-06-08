import React from "react";
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { useTheme } from "../theme/theme";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({ label, onPress, leftIcon, loading, disabled, style }: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: theme.colors.peacockPrimary, opacity: pressed ? 0.9 : 1 },
        theme.shadows.card,
        style,
        isDisabled && { backgroundColor: theme.colors.mutedText },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      <View style={styles.content}>
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <Text style={styles.label}>{label}</Text>
        {loading ? <ActivityIndicator color={theme.colors.surfaceLight} style={styles.spinner} /> : null}
      </View>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, leftIcon, loading, disabled, style }: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: theme.colors.surfaceLight,
          borderColor: theme.colors.border,
          borderWidth: 1,
          opacity: pressed ? 0.9 : 1,
        },
        theme.shadows.card,
        style,
        isDisabled && { backgroundColor: "#E5E7EB" },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      <View style={styles.content}>
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <Text style={[styles.label, { color: theme.colors.textCharcoal }]}>{label}</Text>
        {loading ? <ActivityIndicator color={theme.colors.textCharcoal} style={styles.spinner} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "100%",
    minWidth: 0,
  },
  label: {
    color: "#F8F9FA",
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "center",
  },
  icon: {
    marginRight: 8,
  },
  spinner: {
    marginLeft: 8,
  },
});

export default PrimaryButton;
