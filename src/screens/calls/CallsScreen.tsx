import { useQuery } from "@tanstack/react-query";
import { Button, FlatList, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { api } from "../../services/api";
import { getSocket } from "../../services/socket";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { useCallStore } from "../../state/callStore";
import { Call } from "../../types";
import { styles } from "../styles";
import { createAndStoreCallKey, createCallKeyEnvelopes } from "../../services/callE2ee";

export function CallsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const setActiveCall = useCallStore((state) => state.setActiveCall);
  const incomingCallId = useCallStore((state) => state.incomingCallId);
  const incomingCallerUserId = useCallStore((state) => state.incomingCallerUserId);
  const [calleeUserId, setCalleeUserId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const query = useQuery({ queryKey: ["calls"], queryFn: api.callHistory });

  async function startDirectCall() {
    if (!calleeUserId.trim()) {
      setError("Enter a callee user ID.");
      return;
    }

    try {
      setStarting(true);
      setError(null);
      const result = await api.startDirectCall(calleeUserId.trim(), conversationId.trim() || undefined);
      const mediaKey = await createAndStoreCallKey(result.call);
      setActiveCall(result.call, result.livekit);
      const socket = getSocket();
      socket.emit("call:key", { callId: result.call.id, envelopes: await createCallKeyEnvelopes(result.call, mediaKey) });
      socket.emit("call:ring", { callId: result.call.id });
      navigation.navigate("AudioCall", { callId: result.call.id });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setStarting(false);
    }
  }

  async function startGroupCall() {
    if (!conversationId.trim()) {
      setError("Enter a group conversation ID.");
      return;
    }

    try {
      setStarting(true);
      setError(null);
      const result = await api.startGroupCall(conversationId.trim());
      const mediaKey = await createAndStoreCallKey(result.call);
      setActiveCall(result.call, result.livekit);
      const socket = getSocket();
      socket.emit("call:key", { callId: result.call.id, envelopes: await createCallKeyEnvelopes(result.call, mediaKey) });
      socket.emit("call:ring", { callId: result.call.id });
      navigation.navigate("AudioCall", { callId: result.call.id });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setStarting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Calls</Text>
      {incomingCallId && incomingCallerUserId ? (
        <View style={styles.row}>
          <Text style={styles.rowTitle}>Incoming audio call</Text>
          <Text style={styles.muted}>From {incomingCallerUserId}</Text>
          <Button title="Open" onPress={() => navigation.navigate("IncomingCall", { callId: incomingCallId, callerUserId: incomingCallerUserId })} />
        </View>
      ) : null}
      <TextInput testID="calls-callee-user-id" style={styles.input} placeholder="Callee user ID" value={calleeUserId} onChangeText={setCalleeUserId} />
      <TextInput testID="calls-conversation-id" style={styles.input} placeholder="Conversation ID for direct/group" value={conversationId} onChangeText={setConversationId} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button testID="calls-start-direct" title={starting ? "Starting..." : "Start 1-to-1 audio call"} onPress={startDirectCall} disabled={starting} />
      <Button testID="calls-start-group" title={starting ? "Starting..." : "Start group audio call"} onPress={startGroupCall} disabled={starting} />
      <Text style={styles.titleSmall}>Recent</Text>
      <FlatList
        data={(query.data?.calls ?? []) as Call[]}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.muted}>No calls yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowTitle}>{item.scope} {item.kind}</Text>
            <Text style={styles.muted}>{item.status} - {new Date(item.startedAt).toLocaleString()}</Text>
          </View>
        )}
      />
    </View>
  );
}
