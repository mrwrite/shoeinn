import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";

import { useTheme } from "../../theme/theme";

export function Card({ style, children, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      {...rest}
      style={[styles.card, { backgroundColor: theme.colors.surfaceLight }, theme.shadows.card, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
  },
});

export default Card;
