import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { useTheme } from "../../theme/theme";
import { Text } from "./Text";

type SectionHeaderProps = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: "light" | "dark";
};

/**
 * Shared section header for marketplace and operational screens. Use `action`
 * for compact links, filters, or icon buttons aligned with the section title.
 */
export function SectionHeader({ title, eyebrow, subtitle, action, style, tone = "light" }: SectionHeaderProps) {
  const theme = useTheme();
  const titleColor = tone === "dark" ? theme.colors.surfaceElevated : theme.colors.textPrimary;
  const bodyColor = tone === "dark" ? "rgba(255,255,255,0.82)" : theme.colors.textSecondary;
  const eyebrowColor = tone === "dark" ? theme.colors.accent : theme.colors.accentPressed;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.copy}>
        {eyebrow ? (
          <Text variant="overline" weight="bold" color={eyebrowColor}>
            {eyebrow}
          </Text>
        ) : null}
        <Text variant="h2" weight="bold" style={{ color: titleColor }}>
          {title}
        </Text>
        {subtitle ? (
          <Text color={bodyColor} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  subtitle: {
    marginTop: 2,
  },
  action: {
    minHeight: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
});

export default SectionHeader;
