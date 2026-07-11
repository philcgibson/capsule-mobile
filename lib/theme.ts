import type { ColorValue, TextStyle, ViewStyle } from "react-native";

export const colors = {
  canvas: "#FBF8F2",
  surface: "#FFFEFB",
  surfaceMuted: "#F0EBE3",
  surfaceInset: "#F3EEE7",
  surfaceStrong: "#29201C",
  line: "#DED6CA",
  lineStrong: "#B9AA94",
  ink: "#29201C",
  espresso: "#29201C",
  muted: "#645B53",
  subtle: "#7D7369",
  accent: "#C89B3C",
  accentStrong: "#7A5714",
  accentSoft: "#F1E2BC",
  gold: "#C89B3C",
  goldDark: "#7A5714",
  goldSoft: "#F1E2BC",
  bronze: "#C89B3C",
  bronzeSoft: "#F1E2BC",
  blue: "#5B78C7",
  blueSoft: "#DEE5F6",
  tomato: "#E84A36",
  tomatoSoft: "#F8DDD7",
  olive: "#6C7B48",
  moss: "#6C7B48",
  mossSoft: "#E2E7D7",
  ochre: "#C89B3C",
  danger: "#A33B2C",
  dangerSoft: "#F8DDD7",
  white: "#FFFEFB",
} as const satisfies Record<string, ColorValue>;

export const fonts = {
  body: "Gabarito",
  display: "Piazzolla",
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
} as const;

export const type = {
  eyebrow: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 45,
    fontWeight: "400",
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "400",
  },
  body: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
  label: {
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  small: {
    color: colors.subtle,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
} as const satisfies Record<string, TextStyle>;

export const cardStyle = {
  borderRadius: radius.xl,
  borderCurve: "continuous",
  borderWidth: 1,
  borderColor: colors.line,
  backgroundColor: colors.surface,
} as const satisfies ViewStyle;

export const inputStyle = {
  minHeight: 54,
  borderRadius: radius.md,
  borderCurve: "continuous",
  borderWidth: 1,
  borderColor: colors.line,
  backgroundColor: colors.surface,
  color: colors.ink,
  fontFamily: fonts.body,
  fontSize: 16,
  lineHeight: 22,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
} as const satisfies TextStyle;

export const primaryButtonStyle = {
  minHeight: 56,
  borderRadius: radius.md,
  borderCurve: "continuous",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.espresso,
  paddingHorizontal: spacing.md,
} as const satisfies ViewStyle;

export const secondaryButtonStyle = {
  minHeight: 52,
  borderRadius: radius.md,
  borderCurve: "continuous",
  borderWidth: 1,
  borderColor: colors.lineStrong,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.surface,
  paddingHorizontal: spacing.md,
} as const satisfies ViewStyle;
