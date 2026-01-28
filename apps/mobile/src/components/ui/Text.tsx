import React from "react";
import { Text as RNText, TextProps, StyleSheet } from "react-native";

import { useTheme } from "../../theme/theme";

type Variant = "title" | "subtitle" | "body" | "caption" | "overline";

type Props = TextProps & {
  variant?: Variant;
  weight?: "regular" | "medium" | "semibold" | "bold";
  color?: string;
};

const fontWeightMap: Record<Props["weight"], string> = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};

export function Text({ variant = "body", weight = "regular", style, color, ...rest }: Props) {
  const theme = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        styles.base,
        styles[variant],
        { color: color ?? theme.colors.textCharcoal, fontWeight: fontWeightMap[weight] },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
  title: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 18,
  },
  body: {
    fontSize: 15,
  },
  caption: {
    fontSize: 13,
  },
  overline: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});

export default Text;
