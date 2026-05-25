import { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { api } from "../../services/api";
import { joinAudioRoom, leaveAudioRoom, setAudioMuted } from "../../services/calls";
import { useCallStore } from "../../state/callStore";
import { styles } from "../styles";
import { getSocket } from "../../services/socket";
import { Call } from "../../types";
import { clearCallKey } from "../../services/callE2ee";

export function AudioCallScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "AudioCall">) {
  const { activeCall, joinInfo, setActiveCall, clearActiveCall } = useCallStore();
  const [status, setStatus] = useState("Connecting...");
  const [call, setCall] = useState<Call | null>(activeCall);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function connect() {
      try {
        const callResult = activeCall?.id === route.params.callId ? { call: activeCall } : await api.call(route.params.callId);
        const info = joinInfo ?? (await api.callToken(route.params.callId)).livekit;
        if (!cancelled) {
          setCall(callResult.call);
          setActiveCall(callResult.call, info);
        }
        await joinAudioRoom(info, route.params.callId);
        getSocket().emit("call:accepted", { callId: route.params.callId, callerUserId: callResult.call.callerUserId });
        if (!cancelled) setStatus("Connected");
      } catch (error) {
        if (!cancelled) setStatus((error as Error).message);
      }
    }
    void connect();
    return () => {
      cancelled = true;
      void leaveAudioRoom();
    };
  }, [joinInfo, route.params.callId, setActiveCall]);

  async function toggleMute() {
    const nextMuted = !muted;
    await setAudioMuted(nextMuted);
    setMuted(nextMuted);
  }

  async function end() {
    const result = await api.endCall(route.params.callId);
    getSocket().emit("call:ended", { callId: route.params.callId });
    await leaveAudioRoom();
    clearCallKey(route.params.callId);
    clearActiveCall();
    setStatus(result.ended ? "Call ended" : "Left call");
    navigation.goBack();
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Audio Call</Text>
      <Text style={styles.muted}>Call ID: {route.params.callId}</Text>
      <Text style={styles.muted}>Scope: {call?.scope ?? "Unknown"}</Text>
      <Text style={styles.titleSmall}>{status}</Text>
      <Button title={muted ? "Unmute" : "Mute"} onPress={toggleMute} disabled={status !== "Connected"} />
      <Button title={call?.scope === "GROUP" ? "Leave call" : "End call"} onPress={end} />
    </View>
  );
}
