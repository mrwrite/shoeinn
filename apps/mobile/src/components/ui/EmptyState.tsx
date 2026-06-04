import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { useTheme } from "../../theme/theme";
import { Button } from "./Button";
import { Text } from "./Text";

type EmptyStateProps = {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * EmptyState keeps no-data and error-adjacent states consistent. Prefer concise
 * role-specific copy and one practical action such as refresh or browse.
 */
export function EmptyState({ title, message, icon = "sparkles-outline", actionLabel, onAction, style }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.borderSoft }, theme.shadows.soft, style]}>
      <View style={[styles.iconBubble, { backgroundColor: theme.colors.accentSoft }]}>
        <Ionicons name={icon} size={26} color={theme.colors.primary} />
      </View>
      <Text variant="h3" weight="bold" style={styles.title}>
        {title}
      </Text>
      {message ? (
        <Text color={theme.colors.textSecondary} style={styles.message}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
  },
  iconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 14,
    textAlign: "center",
  },
  message: {
    marginTop: 6,
    textAlign: "center",
  },
  action: {
    marginTop: 18,
    alignSelf: "stretch",
  },
});

export default EmptyState;
