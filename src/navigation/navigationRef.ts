import { createNavigationContainerRef } from "@react-navigation/native";
import { RootStackParamList } from "./RootNavigator";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToAudioCall(callId: string) {
  if (navigationRef.isReady()) {
    navigationRef.navigate("AudioCall", { callId });
  }
}

export function navigateToIncomingCall(callId: string, callerUserId = "unknown") {
  if (navigationRef.isReady()) {
    navigationRef.navigate("IncomingCall", { callId, callerUserId });
  }
}

export function navigateToChat(conversationId: string) {
  if (navigationRef.isReady()) {
    navigationRef.navigate("Chat", { conversationId });
  }
}
