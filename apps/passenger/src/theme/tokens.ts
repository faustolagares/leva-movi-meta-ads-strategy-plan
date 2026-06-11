/**
 * Design tokens — tema neutro light/dark.
 * Acento de marca entra por cima como camada (brand_config, doc 3); aqui o
 * núcleo é neutro de propósito, como manda a fundação e o padrão Apple.
 */
import { Platform } from "react-native";

export const palette = {
  label: "#0B0B0C",
  labelSecondary: "#6E6E73",
  labelTertiary: "#A6A6AB",
  separator: "rgba(60,60,67,0.18)",
  fill: "rgba(118,118,128,0.12)",
  systemBlue: "#0A84FF",
  systemRed: "#FF453A",
  surface: "#FFFFFF",
  onAccent: "#FFFFFF",
  ctaBackground: "#0B0B0C",
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 22,
  pill: 999,
  sheet: 28,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
} as const;

export const typography = {
  largeTitle: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.6 },
  title: { fontSize: 21, fontWeight: "700" as const, letterSpacing: -0.4 },
  body: { fontSize: 16.5, fontWeight: "600" as const, letterSpacing: -0.2 },
  callout: { fontSize: 15.5, fontWeight: "600" as const, letterSpacing: -0.2 },
  subhead: { fontSize: 13.5, fontWeight: "500" as const, letterSpacing: -0.1 },
  caption: { fontSize: 12.5, fontWeight: "500" as const },
} as const;

export const fontFamily = Platform.select({
  ios: undefined, // San Francisco (system) — o padrão Apple
  default: "System",
});
