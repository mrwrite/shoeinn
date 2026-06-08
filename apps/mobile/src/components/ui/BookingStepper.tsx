import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { useTheme } from "../../theme/theme";
import { Text } from "./Text";

export type BookingStep = {
  key: string;
  label: string;
};

type BookingStepperProps = {
  steps: BookingStep[];
  currentIndex: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Presentational booking progress indicator. Screens own navigation and
 * completion logic; this component only renders the visual hierarchy.
 */
export function BookingStepper({ steps, currentIndex, style }: BookingStepperProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.borderSoft }, theme.shadows.soft, style]}>
      {steps.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isActive = isComplete || isCurrent;

        return (
          <View key={step.key} style={styles.step}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: isActive ? theme.colors.primary : theme.colors.surfaceMuted,
                  borderColor: isCurrent ? theme.colors.accent : theme.colors.borderSoft,
                },
              ]}
            >
              <Text variant="meta" weight="bold" style={{ color: isActive ? theme.colors.surfaceElevated : theme.colors.textMuted }}>
                {index + 1}
              </Text>
            </View>
            <Text
              variant="meta"
              weight={isCurrent ? "bold" : "semibold"}
              numberOfLines={2}
              style={[styles.label, { color: isCurrent ? theme.colors.primary : theme.colors.textMuted }]}
            >
              {step.label}
            </Text>
            {index < steps.length - 1 ? (
              <View style={[styles.line, { backgroundColor: isComplete ? theme.colors.primary : theme.colors.divider }]} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 74,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  step: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 6,
  },
  label: {
    textAlign: "center",
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    position: "absolute",
    top: 15,
    left: "58%",
    right: "-42%",
    height: 2,
    borderRadius: 999,
  },
});

export default BookingStepper;
