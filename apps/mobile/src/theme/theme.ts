import { StyleSheet, type TextStyle, type ViewStyle } from "react-native";

const palette = {
  ink900: "#1B1E24",
  ink700: "#3B424C",
  ink500: "#6F7782",
  ink300: "#9BA3AD",
  porcelain: "#FAF8F4",
  cream: "#F8F5EF",
  white: "#FFFFFF",
  linen: "#F3EDE3",
  oat: "#EFE7D9",
  mist: "#F1F6F5",
  border: "#E5DACE",
  borderSoft: "#EFE7DC",
  divider: "#EEE4D8",
  peacock: "#0B5563",
  peacockPressed: "#083F4A",
  teal: "#117B7C",
  mint: "#CFE9E5",
  gold: "#D6A73D",
  goldPressed: "#B88722",
  goldSoft: "#F8EBC4",
  green: "#16784A",
  greenSoft: "#E4F3EA",
  amber: "#AD751B",
  amberSoft: "#F7E7C7",
  red: "#C9372C",
  redSoft: "#F8DEDA",
};

/**
 * Semantic tokens are the preferred API for luxury UI work. Existing alias
 * names stay available so current screens can migrate gradually without
 * changing business logic or navigation/payment behavior.
 */
export const colors = {
  background: palette.porcelain,
  surface: palette.cream,
  surfaceElevated: palette.white,
  surfaceMuted: palette.linen,
  surfaceTint: palette.mist,
  card: palette.white,
  primary: palette.peacock,
  secondary: palette.teal,
  success: palette.green,
  warning: palette.amber,
  danger: palette.red,
  error: palette.red,
  textPrimary: palette.ink900,
  textSecondary: palette.ink700,
  textMuted: palette.ink500,
  textSubtle: palette.ink300,
  border: palette.border,
  borderSoft: palette.borderSoft,
  divider: palette.divider,
  accent: palette.gold,
  accentSoft: palette.goldSoft,
  accentPressed: palette.goldPressed,
  primaryPressed: palette.peacockPressed,
  tint: palette.mint,
  successSoft: palette.greenSoft,
  warningSoft: palette.amberSoft,
  dangerSoft: palette.redSoft,
  errorSoft: palette.redSoft,
  overlay: "rgba(27, 30, 36, 0.46)",

  // Compatibility aliases for the current screen/component set.
  peacockPrimary: palette.peacock,
  tealSecondary: palette.teal,
  emeraldAccent: palette.mint,
  goldHighlight: palette.gold,
  textCharcoal: palette.ink900,
  surfaceLight: palette.porcelain,
  mutedText: palette.ink500,
  softBorder: palette.borderSoft,
  luxuryGold: palette.gold,
};

export const statusColors = {
  requested: colors.primary,
  confirmed: colors.secondary,
  pendingPayment: colors.warning,
  paymentFailed: colors.danger,
  enRoute: colors.primary,
  pickedUp: colors.secondary,
  inProgress: colors.warning,
  ready: colors.success,
  outForDelivery: colors.secondary,
  delivered: colors.success,
  completed: colors.textSecondary,
  cancelled: colors.textMuted,
  unread: colors.primary,
  highPriority: colors.warning,
};

export const spacing = {
  xs: 4,
  sm: 8,
  rg: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 56,
};

export const radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 36,
  pill: 999,
};

export const sizes = {
  minTouchTarget: 44,
  buttonHeight: 52,
  compactButtonHeight: 44,
};

export const typography = {
  display: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
    color: colors.textPrimary,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    color: colors.textMuted,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: colors.textMuted,
  },
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.surfaceElevated,
  },
} satisfies Record<string, TextStyle>;

export const textStyles = StyleSheet.create({
  display: typography.display,
  h1: typography.h1,
  h2: typography.h2,
  h3: typography.h3,
  body: typography.body,
  bodySmall: typography.bodySmall,
  caption: typography.caption,
  meta: typography.meta,
  button: typography.button,
  title: typography.h1,
  subtitle: typography.h3,
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: colors.textMuted,
  },
});

export const shadows = {
  card: {
    shadowColor: "#1B1E24",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
    elevation: 3,
  } satisfies ViewStyle,
  floating: {
    shadowColor: "#1B1E24",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 7,
  } satisfies ViewStyle,
  modal: {
    shadowColor: "#1B1E24",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 40,
    elevation: 10,
  } satisfies ViewStyle,
  soft: {
    shadowColor: "#1B1E24",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  } satisfies ViewStyle,
};

export const theme = {
  colors,
  statusColors,
  spacing,
  radii,
  sizes,
  typography,
  textStyles,
  shadows,
  scheme: "light",
} as const;

export function useTheme() {
  return theme;
}

export type Theme = typeof theme;
