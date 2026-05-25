import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { useEffect } from "react";
import { api } from "./api";
import { useSessionStore } from "../state/sessionStore";
import { navigateToChat, navigateToIncomingCall } from "../navigation/navigationRef";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true
  })
});

async function ensureNotificationChannels() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("messages", {
    name: "Messages",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#2f80ed"
  });
  await Notifications.setNotificationChannelAsync("calls", {
    name: "Incoming calls",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 250, 500],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
    sound: "default"
  });
}

export async function registerPushNotifications() {
  const session = useSessionStore.getState().session;
  if (!session) return;

  await ensureNotificationChannels();
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  await api.registerPushToken({
    deviceId: session.device.id,
    expoPushToken: token.data,
    platform: Platform.OS,
    appVersion: Constants.expoConfig?.version
  });
}

export async function unregisterPushNotifications() {
  const session = useSessionStore.getState().session;
  if (!session) return;
  await api.unregisterPushTokens(session.device.id);
}

function handleNotificationData(data: Record<string, unknown>) {
  if (data.type === "incoming_call" && typeof data.callId === "string") {
    navigateToIncomingCall(data.callId, typeof data.callerUserId === "string" ? data.callerUserId : "unknown");
    return;
  }

  if (data.type === "message" && typeof data.conversationId === "string") {
    navigateToChat(data.conversationId);
  }
}

export function usePushNotifications() {
  const session = useSessionStore((state) => state.session);

  useEffect(() => {
    if (!session) return;

    void registerPushNotifications().catch(() => undefined);
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, unknown>;
      if (data.type === "incoming_call") {
        // Keep this hook hot for call pushes; native call UI is still driven by Socket.IO when online.
      }
    });
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationData(response.notification.request.content.data as Record<string, unknown>);
    });
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationData(response.notification.request.content.data as Record<string, unknown>);
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [session]);
}
