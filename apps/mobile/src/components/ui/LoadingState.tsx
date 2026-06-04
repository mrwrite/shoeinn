import React from "react";
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { useTheme } from "../../theme/theme";
import { Text } from "./Text";

type LoadingStateProps = {
  label?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * LoadingState provides a stable loading layout for screens and cards without
 * introducing fragile skeleton animations.
 */
export function LoadingState({ label = "Loading", style }: LoadingStateProps) {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.borderSoft }, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      <ActivityIndicator color={theme.colors.primary} />
      <Text variant="caption" color={theme.colors.textSecondary} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
  },
  label: {
    marginTop: 10,
    textAlign: "center",
  },
});

export default LoadingState;
