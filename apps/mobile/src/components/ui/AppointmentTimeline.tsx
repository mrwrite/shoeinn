import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { useTheme } from "../../theme/theme";
import { Text } from "./Text";

export type AppointmentTimelineState = "completed" | "current" | "upcoming" | "terminal";

export type AppointmentTimelineItem = {
  key: string;
  title: string;
  detail?: string;
  state: AppointmentTimelineState;
};

type AppointmentTimelineProps = {
  items: AppointmentTimelineItem[];
  style?: StyleProp<ViewStyle>;
};

/**
 * Reusable appointment progress tracker. Build the item list in the screen so
 * timeline rendering stays presentational and does not own appointment logic.
 */
export function AppointmentTimeline({ items, style }: AppointmentTimelineProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isCompleted = item.state === "completed";
        const isCurrent = item.state === "current";
        const isTerminal = item.state === "terminal";
        const accent = isTerminal
          ? theme.colors.textSecondary
          : isCurrent
            ? theme.colors.primary
            : isCompleted
              ? theme.colors.success
              : theme.colors.border;

        return (
          <View key={item.key} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: accent,
                    borderColor: isCurrent ? theme.colors.surfaceElevated : accent,
                  },
                  isCurrent && styles.dotCurrent,
                ]}
              />
              {!isLast ? (
                <View
                  style={[
                    styles.line,
                    {
                      backgroundColor: isCompleted || isCurrent ? theme.colors.primary : theme.colors.divider,
                    },
                  ]}
                />
              ) : null}
            </View>
            <View
              style={[
                styles.content,
                {
                  backgroundColor: isCurrent ? `${theme.colors.primary}10` : theme.colors.card,
                  borderColor: isCurrent ? `${theme.colors.primary}33` : theme.colors.borderSoft,
                },
                isCurrent && theme.shadows.soft,
              ]}
            >
              <Text weight={isCurrent || isCompleted || isTerminal ? "bold" : "semibold"} color={isCurrent ? theme.colors.primary : theme.colors.textPrimary}>
                {item.title}
              </Text>
              {item.detail ? (
                <Text variant="caption" color={theme.colors.textSecondary} style={styles.detail}>
                  {item.detail}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  rail: {
    width: 18,
    alignItems: "center",
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    marginTop: 16,
  },
  dotCurrent: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginTop: 14,
  },
  line: {
    flex: 1,
    width: 2,
    marginTop: 4,
  },
  content: {
    flex: 1,
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
  },
  detail: {
    marginTop: 4,
  },
});

export default AppointmentTimeline;
