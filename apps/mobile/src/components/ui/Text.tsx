import React from "react";
import { Text as RNText, TextProps, StyleSheet, type TextStyle } from "react-native";

import { useTheme } from "../../theme/theme";

type Variant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "title"
  | "subtitle"
  | "body"
  | "bodySmall"
  | "caption"
  | "meta"
  | "button"
  | "overline";
type Weight = "regular" | "medium" | "semibold" | "bold";

type Props = TextProps & {
  variant?: Variant;
  weight?: Weight;
  color?: string;
};

const fontWeightMap: Record<Weight, TextStyle["fontWeight"]> = {
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
        theme.textStyles[variant],
        { color: color ?? theme.colors.textPrimary, fontWeight: fontWeightMap[weight] },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});

export default Text;
