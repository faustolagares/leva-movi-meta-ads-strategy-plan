import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_DEFAULT,
  type LatLng,
  type Region,
} from "react-native-maps";
import { palette } from "../theme/tokens";

// Itaberaí, Goiás — cidade do piloto.
const ORIGIN: LatLng = { latitude: -16.0179, longitude: -49.8104 };
const DESTINATION: LatLng = { latitude: -16.0241, longitude: -49.7986 };

const INITIAL_REGION: Region = {
  latitude: -16.0205,
  longitude: -49.8045,
  latitudeDelta: 0.025,
  longitudeDelta: 0.025,
};

const ROUTE: LatLng[] = [
  ORIGIN,
  { latitude: -16.0179, longitude: -49.8042 },
  { latitude: -16.0241, longitude: -49.8042 },
  DESTINATION,
];

export const MapCanvas = React.forwardRef<MapView>((_props, ref) => {
  return (
    <MapView
      ref={ref}
      provider={PROVIDER_DEFAULT}
      style={StyleSheet.absoluteFill}
      initialRegion={INITIAL_REGION}
      showsCompass={false}
      showsUserLocation
      mapPadding={{ top: 0, right: 0, bottom: 360, left: 0 }}
    >
      <Polyline
        coordinates={ROUTE}
        strokeColor={palette.systemBlue}
        strokeWidth={5}
        lineCap="round"
        lineJoin="round"
      />
      <Marker coordinate={ORIGIN} anchor={{ x: 0.5, y: 0.5 }}>
        <OriginDot />
      </Marker>
      <Marker coordinate={DESTINATION} />
    </MapView>
  );
});

MapCanvas.displayName = "MapCanvas";

function OriginDot() {
  return (
    <View style={dot.ring}>
      <View style={dot.core} />
    </View>
  );
}

const dot = StyleSheet.create({
  ring: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(10,132,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  core: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.systemBlue,
    borderWidth: 3,
    borderColor: "#fff",
  },
});

export { MapView };
export const MAP_FOCUS = { ORIGIN, DESTINATION, INITIAL_REGION };
