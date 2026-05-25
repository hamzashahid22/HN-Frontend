import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { useSessionStore } from "../state/sessionStore";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { SignupScreen } from "../screens/auth/SignupScreen";
import { MfaScreen } from "../screens/auth/MfaScreen";
import { MainTabs } from "./MainTabs";
import { ChatScreen } from "../screens/chat/ChatScreen";
import { GroupInfoScreen } from "../screens/groups/GroupInfoScreen";
import { AudioCallScreen } from "../screens/calls/AudioCallScreen";
import { IncomingCallScreen } from "../screens/calls/IncomingCallScreen";

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Mfa: { userId: string };
  Main: undefined;
  Chat: { conversationId: string; title?: string };
  GroupInfo: { conversationId: string };
  AudioCall: { callId: string };
  IncomingCall: { callId: string; callerUserId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { bootstrapped, session } = useSessionStore();

  if (!bootstrapped) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {session ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="GroupInfo" component={GroupInfoScreen} options={{ title: "Group info" }} />
          <Stack.Screen name="AudioCall" component={AudioCallScreen} options={{ title: "Audio call" }} />
          <Stack.Screen name="IncomingCall" component={IncomingCallScreen} options={{ title: "Incoming call" }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Log in" }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ title: "Create account" }} />
          <Stack.Screen name="Mfa" component={MfaScreen} options={{ title: "Verification" }} />
        </>
      )}
    </Stack.Navigator>
  );
}
