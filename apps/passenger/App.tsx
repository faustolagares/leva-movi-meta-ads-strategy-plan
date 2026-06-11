import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RideRequestScreen } from "./src/screens/RideRequestScreen";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <RideRequestScreen />
    </SafeAreaProvider>
  );
}
