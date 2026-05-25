import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { registerGlobals } from "@livekit/react-native";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { navigationRef } from "./src/navigation/navigationRef";
import { useSessionBootstrap } from "./src/state/sessionStore";
import { useCallSignaling } from "./src/services/useCallSignaling";
import { usePushNotifications } from "./src/services/push";

registerGlobals();

const queryClient = new QueryClient();

export default function App() {
  useSessionBootstrap();
  useCallSignaling();
  usePushNotifications();

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="auto" />
        <RootNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}
