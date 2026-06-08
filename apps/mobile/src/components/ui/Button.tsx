import React from "react";
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { useTheme } from "../../theme/theme";
import { Text } from "./Text";

type Variant = "primary" | "gold" | "secondary" | "ghost" | "destructive";
type Size = "default" | "compact";

type Props = {
  label: string;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  accessibilityLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  size?: Size;
  style?: StyleProp<ViewStyle>;
};

/**
 * Shared app button for new polished screens. Existing screens can keep using
 * this component while migrating variants one at a time.
 */
export function Button({
  label,
  onPress,
  leftIcon,
  rightIcon,
  accessibilityLabel,
  disabled,
  loading,
  variant = "primary",
  size = "default",
  style,
}: Props) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const variantStyle = {
    primary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primaryPressed,
      textColor: theme.colors.surfaceElevated,
      shadow: theme.shadows.card,
    },
    gold: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accentPressed,
      textColor: theme.colors.textPrimary,
      shadow: theme.shadows.card,
    },
    secondary: {
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.borderSoft,
      textColor: theme.colors.textPrimary,
      shadow: undefined,
    },
    ghost: {
      backgroundColor: "transparent",
      borderColor: "transparent",
      textColor: theme.colors.primary,
      shadow: undefined,
    },
    destructive: {
      backgroundColor: theme.colors.danger,
      borderColor: theme.colors.danger,
      textColor: theme.colors.surfaceElevated,
      shadow: undefined,
    },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        size === "compact" ? styles.compact : styles.default,
        {
          backgroundColor: variantStyle.backgroundColor,
          borderColor: variantStyle.borderColor,
          opacity: pressed ? 0.92 : 1,
        },
        variantStyle.shadow,
        variant !== "ghost" && { borderWidth: 1 },
        variant === "ghost" && { paddingHorizontal: 0 },
        isDisabled && [
          styles.disabled,
          variant !== "ghost" && {
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: theme.colors.borderSoft,
          },
        ],
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.textColor} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
          <Text variant="button" weight="bold" style={[styles.label, { color: variantStyle.textColor }]}>
            {label}
          </Text>
          {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 8,
  },
  default: {
    minHeight: 52,
  },
  compact: {
    minHeight: 44,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    maxWidth: "100%",
    minWidth: 0,
  },
  label: {
    flexShrink: 1,
    textAlign: "center",
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.64,
  },
});

export default Button;
