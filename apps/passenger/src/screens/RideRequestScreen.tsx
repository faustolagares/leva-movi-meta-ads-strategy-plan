import React, { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type MapView from "react-native-maps";

import { GlassSurface } from "../components/GlassSurface";
import { MapCanvas, MAP_FOCUS } from "../components/MapCanvas";
import { RideSheet, RIDE_OPTIONS } from "../components/RideSheet";
import { palette, radii, spacing, typography } from "../theme/tokens";

export function RideRequestScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [selectedId, setSelectedId] = useState(RIDE_OPTIONS[1].id);

  const recenter = () => {
    mapRef.current?.animateToRegion(MAP_FOCUS.INITIAL_REGION, 400);
  };

  return (
    <View style={styles.root}>
      <MapCanvas ref={mapRef} />

      {/* Camada de navegação — vidro flutuando sobre o mapa */}
      <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
        <GlassSurface glassEffectStyle="clear" style={styles.search} interactive>
          <SymbolView
            name="magnifyingglass"
            size={19}
            tintColor={palette.labelSecondary}
          />
          <Text style={[typography.callout, styles.searchPlaceholder]}>
            Para onde vamos?
          </Text>
        </GlassSurface>

        <GlassSurface glassEffectStyle="clear" style={styles.avatar} interactive>
          <SymbolView
            name="person.crop.circle"
            size={26}
            tintColor={palette.label}
          />
        </GlassSurface>
      </View>

      <GlassSurface
        glassEffectStyle="clear"
        interactive
        style={[styles.recenter, { bottom: insets.bottom + 372 }]}
      >
        <Pressable style={styles.recenterHit} onPress={recenter}>
          <SymbolView
            name="location.fill"
            size={20}
            tintColor={palette.systemBlue}
          />
        </Pressable>
      </GlassSurface>

      {/* Camada de conteúdo */}
      <RideSheet
        options={RIDE_OPTIONS}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onConfirm={() => {
          // próxima fase: criar corrida (módulo trip)
        }}
      />
    </View>
  );
}

const SEARCH_HEIGHT = 52;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EDEBE5" },
  topBar: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
  },
  search: {
    flex: 1,
    height: SEARCH_HEIGHT,
    borderRadius: radii.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 18,
  },
  searchPlaceholder: { color: "#4A4A4F" },
  avatar: {
    width: SEARCH_HEIGHT,
    height: SEARCH_HEIGHT,
    borderRadius: SEARCH_HEIGHT / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  recenter: {
    position: "absolute",
    right: spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  recenterHit: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
