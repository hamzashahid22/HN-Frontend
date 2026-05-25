import { Button, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { api } from "../../services/api";
import { getSocket } from "../../services/socket";
import { useCallStore } from "../../state/callStore";
import { styles } from "../styles";

export function IncomingCallScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "IncomingCall">) {
  const clearIncomingCall = useCallStore((state) => state.clearIncomingCall);

  async function accept() {
    clearIncomingCall();
    navigation.replace("AudioCall", { callId: route.params.callId });
  }

  async function reject() {
    await api.rejectCall(route.params.callId);
    getSocket().emit("call:rejected", { callId: route.params.callId, callerUserId: route.params.callerUserId });
    clearIncomingCall();
    navigation.goBack();
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Incoming audio call</Text>
      <Text style={styles.muted}>From: {route.params.callerUserId}</Text>
      <Button title="Accept" onPress={accept} />
      <Button title="Reject" onPress={reject} />
    </View>
  );
}
