import React from "react";
import { Pressable, PressableProps, View, ViewProps, StyleSheet } from "react-native";

import { useTheme } from "../../theme/theme";

type AppCardVariant = "default" | "elevated" | "marketplace" | "compact" | "outline";

type AppCardProps = ViewProps & {
  variant?: AppCardVariant;
};

type PressableCardProps = Omit<PressableProps, "style"> & {
  variant?: AppCardVariant;
  style?: ViewProps["style"];
};

/**
 * Shared card surface. Use `marketplace` for customer discovery/service cards
 * and `compact` or `outline` for denser provider/admin operational content.
 */
export function Card({ style, children, variant = "default", ...rest }: AppCardProps) {
  const theme = useTheme();
  return (
    <View
      {...rest}
      style={[
        styles.card,
        variant === "compact" && styles.compact,
        variant === "marketplace" && styles.marketplace,
        variant === "outline" && styles.outline,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.borderSoft,
        },
        variant !== "outline" && theme.shadows.soft,
        variant === "elevated" && theme.shadows.floating,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function PressableCard({ style, children, variant = "default", ...rest }: PressableCardProps) {
  const theme = useTheme();
  const isInteractive = Boolean(rest.onPress);

  return (
    <Pressable
      {...rest}
      accessibilityRole={rest.accessibilityRole ?? (isInteractive ? "button" : undefined)}
      accessibilityState={rest.accessibilityState ?? { disabled: Boolean(rest.disabled) }}
      style={({ pressed }) => [
        styles.card,
        styles.pressable,
        variant === "compact" && styles.compact,
        variant === "marketplace" && styles.marketplace,
        variant === "outline" && styles.outline,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.borderSoft,
          opacity: pressed ? 0.94 : 1,
        },
        variant !== "outline" && theme.shadows.soft,
        variant === "elevated" && theme.shadows.floating,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  marketplace: {
    borderRadius: 32,
    padding: 18,
  },
  compact: {
    borderRadius: 16,
    padding: 12,
  },
  outline: {
    shadowOpacity: 0,
    elevation: 0,
  },
  pressable: {
    minHeight: 44,
  },
});

export default Card;
