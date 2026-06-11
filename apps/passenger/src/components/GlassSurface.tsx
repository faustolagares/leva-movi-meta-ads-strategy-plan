import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";

type GlassStyle = "regular" | "clear";

type Props = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** "clear" over media-rich content (maps/photos); "regular" elsewhere. */
  glassEffectStyle?: GlassStyle;
  /** iOS-only touch-responsive glass. */
  interactive?: boolean;
  tintColor?: string;
};

const available = isLiquidGlassAvailable();

/**
 * Liquid Glass na camada de navegação. Usa o material nativo do iOS 26
 * (expo-glass-effect); cai para BlurView quando o vidro não está disponível
 * (iOS < 26 / Android), preservando legibilidade.
 */
export function GlassSurface({
  children,
  style,
  glassEffectStyle = "clear",
  interactive = false,
  tintColor,
}: Props) {
  if (available) {
    return (
      <GlassView
        style={style}
        glassEffectStyle={glassEffectStyle}
        isInteractive={interactive}
        tintColor={tintColor}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View style={[styles.fallbackWrap, style]}>
      <BlurView
        intensity={glassEffectStyle === "clear" ? 24 : 50}
        tint="systemChromeMaterialLight"
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackWrap: {
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.6)",
  },
});
