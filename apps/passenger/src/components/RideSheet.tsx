import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette, radii, spacing, typography } from "../theme/tokens";

export type RideOption = {
  id: string;
  name: string;
  detail: string;
  price: string;
  eta: string;
  symbol: SymbolViewProps["name"];
};

export const RIDE_OPTIONS: RideOption[] = [
  { id: "moto", name: "Moto", detail: "A mais rápida", price: "R$ 6,90", eta: "2 min", symbol: "scooter" },
  { id: "carro", name: "Carro", detail: "Até 4 pessoas", price: "R$ 12,50", eta: "4 min", symbol: "car.fill" },
  { id: "taxi", name: "Táxi", detail: "Taxista credenciado", price: "R$ 15,00", eta: "6 min", symbol: "car.side.fill" },
];

type Props = {
  options: RideOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onConfirm: () => void;
};

export function RideSheet({ options, selectedId, onSelect, onConfirm }: Props) {
  const insets = useSafeAreaInsets();
  const selected = options.find((o) => o.id === selectedId) ?? options[0];

  return (
    <BlurView
      intensity={64}
      tint="systemThickMaterialLight"
      style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}
    >
      <View style={styles.handle} />

      <Text style={[typography.title, styles.title]}>Escolha sua corrida</Text>
      <Text style={[typography.subhead, styles.sub]}>
        Rodoviária de Itaberaí · 4,2 km
      </Text>

      <View style={styles.list}>
        {options.map((option, index) => {
          const isSelected = option.id === selectedId;
          return (
            <Pressable
              key={option.id}
              onPress={() => onSelect(option.id)}
              style={[
                styles.row,
                isSelected && styles.rowSelected,
                index > 0 && !isSelected && styles.rowDivider,
              ]}
            >
              <SymbolView
                name={option.symbol}
                size={30}
                tintColor={palette.label}
                style={styles.rowSymbol}
                resizeMode="scaleAspectFit"
              />
              <View style={styles.rowInfo}>
                <Text style={typography.body}>{option.name}</Text>
                <Text style={[typography.subhead, styles.secondary]}>
                  {option.detail}
                </Text>
              </View>
              <View style={styles.rowPrice}>
                <Text style={typography.body}>{option.price}</Text>
                <Text style={[typography.caption, styles.secondary]}>
                  {option.eta}
                </Text>
              </View>
              {isSelected ? (
                <SymbolView
                  name="checkmark.circle.fill"
                  size={22}
                  tintColor={palette.systemBlue}
                  style={styles.check}
                />
              ) : (
                <View style={styles.check} />
              )}
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.payRow}>
        <SymbolView name="creditcard.fill" size={20} tintColor={palette.label} />
        <Text style={[typography.callout, styles.payLabel]}>Pix</Text>
        <Text style={[typography.subhead, styles.secondary]}>Trocar</Text>
        <SymbolView
          name="chevron.right"
          size={13}
          tintColor={palette.labelTertiary}
        />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={onConfirm}
      >
        <Text style={[typography.body, styles.ctaLabel]}>
          Confirmar {selected.name}
        </Text>
      </Pressable>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    overflow: "hidden",
    paddingTop: spacing.sm,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(60,60,67,0.3)",
    alignSelf: "center",
    marginTop: 6,
    marginBottom: spacing.md,
  },
  title: { color: palette.label, paddingHorizontal: spacing.lg },
  sub: {
    color: palette.labelSecondary,
    paddingHorizontal: spacing.lg,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  list: { paddingHorizontal: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  rowSelected: { backgroundColor: "rgba(118,118,128,0.12)" },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.separator,
    borderRadius: 0,
  },
  rowSymbol: { width: 38, height: 28 },
  rowInfo: { flex: 1 },
  rowPrice: { alignItems: "flex-end" },
  secondary: { color: palette.labelSecondary, marginTop: 1 },
  check: { width: 22, height: 22, marginLeft: 2 },
  payRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    height: 50,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: palette.fill,
  },
  payLabel: { flex: 1, color: palette.label },
  cta: {
    height: 54,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radii.md,
    backgroundColor: palette.ctaBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPressed: { opacity: 0.85 },
  ctaLabel: { color: palette.onAccent },
});
