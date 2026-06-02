import { StyleSheet } from "react-native";

export const colors = {
  peacockPrimary: "#0F4C5C",
  tealSecondary: "#1B998B",
  emeraldAccent: "#2EC4B6",
  goldHighlight: "#E6AF2E",
  textCharcoal: "#1F2933",
  surfaceLight: "#F8F9FA",
  border: "#E5E7EB",
  mutedText: "#6B7280",
  danger: "#DC2626",
};

const darkColors = {
  ...colors,
  surfaceLight: "#0B0C10",
  textCharcoal: "#F3F4F6",
  mutedText: "#9CA3AF",
  border: "#1F2937",
};

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
};

export const textStyles = StyleSheet.create({
  h1: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textCharcoal,
  },
  h2: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.textCharcoal,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    color: colors.textCharcoal,
  },
  caption: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.mutedText,
  },
  button: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.surfaceLight,
  },
});

export const shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
};

export function useTheme() {
  const palette = colors;

  return {
    colors: palette,
    spacing,
    radii,
    textStyles,
    shadows,
    scheme: "light",
  } as const;
}

export type Theme = ReturnType<typeof useTheme>;
