import { useEffect, useMemo, useState } from "react";
import { Button, FlatList, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { getSocket } from "../../services/socket";
import { decryptMessage } from "../../services/crypto/e2ee";
import { Message } from "../../types";
import { styles } from "../styles";
import { api } from "../../services/api";
import { useSessionStore } from "../../state/sessionStore";
import { useCallStore } from "../../state/callStore";
import { createAndStoreCallKey, createCallKeyEnvelopes } from "../../services/callE2ee";
import {
  buildEncryptedOutboundPayload,
  flushOutboundQueue,
  loadCachedConversationMessages,
  queueMessage,
  sendEncryptedPayload,
  subscribeToReconnectFlush,
  syncConversation
} from "../../services/offlineSync";

export function ChatScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "Chat">) {
  const { conversationId } = route.params;
  const session = useSessionStore((state) => state.session);
  const setActiveCall = useCallStore((state) => state.setActiveCall);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [calling, setCalling] = useState(false);
  const socket = useMemo(() => (session ? getSocket() : null), [session]);

  useEffect(() => {
    if (!socket) return;
    let cancelled = false;

    async function loadHistory() {
      const cached = await loadCachedConversationMessages(conversationId);
      if (!cancelled && cached.length) setMessages(cached);
      const synced = await syncConversation(conversationId);
      if (!cancelled && synced.length) {
        setMessages((items) => mergeMessages(synced, items));
      }
      const flushed = await flushOutboundQueue(conversationId);
      if (!cancelled && flushed.length) {
        setMessages((items) => mergeMessages(flushed, items));
      }
    }

    void loadHistory().catch((err) => setError((err as Error).message));
    const unsubscribeReconnect = subscribeToReconnectFlush((flushed) => {
      const scoped = flushed.filter((message) => message.conversationId === conversationId);
      if (scoped.length) setMessages((items) => mergeMessages(scoped, items));
    });
    socket.emit("conversation:join", { conversationId });
    socket.on("message:new", async (message: Message) => {
      if (message.conversationId === conversationId) {
        const plaintext = await decryptMessage(message).catch(() => undefined);
        const hydrated = { ...message, plaintext, localStatus: "sent" as const };
        setMessages((items) => {
          if (items.some((item) => item.id === message.id || item.clientMessageId === message.clientMessageId)) return items;
          return [hydrated, ...items];
        });
      }
    });
    return () => {
      cancelled = true;
      unsubscribeReconnect();
      socket.off("message:new");
    };
  }, [conversationId, socket]);

  async function send() {
    if (!text.trim()) return;
    if (!session || !socket) {
      setError("You must be logged in to send messages.");
      return;
    }

    try {
      setSending(true);
      setError(null);
      const plaintext = text.trim();
      const clientMessageId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const payload = await buildEncryptedOutboundPayload(conversationId, plaintext, clientMessageId);
      const optimistic: Message = {
        id: `local:${clientMessageId}`,
        conversationId,
        senderUserId: session.user.id,
        senderDeviceId: session.device.id,
        clientMessageId,
        ciphertext: payload.ciphertext,
        encryptionHeader: payload.encryptionHeader,
        plaintext,
        localStatus: "pending",
        serverCreatedAt: new Date().toISOString()
      };
      setMessages((items) => mergeMessages([optimistic], items));

      try {
        const message = await sendEncryptedPayload(payload);
        setMessages((items) => mergeMessages([{ ...message, plaintext, localStatus: "sent" }], items));
      } catch (err) {
        await queueMessage(conversationId, plaintext, payload, (err as Error).message);
        setMessages((items) => mergeMessages([{ ...optimistic, localStatus: "pending" }], items));
      } finally {
        setText("");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function startAudioCall() {
    if (!session || !socket) {
      setError("You must be logged in to start a call.");
      return;
    }

    try {
      setCalling(true);
      setError(null);
      const result = await api.conversation(conversationId);
      const calleeUserId = result.conversation.memberIds.find((userId) => userId !== session.user.id);
      if (result.conversation.type === "DIRECT" && !calleeUserId) {
        throw new Error("No callee found for this direct chat.");
      }
      const callResult = result.conversation.type === "GROUP"
        ? await api.startGroupCall(conversationId)
        : await api.startDirectCall(calleeUserId!, conversationId);
      const mediaKey = await createAndStoreCallKey(callResult.call);
      setActiveCall(callResult.call, callResult.livekit);
      socket.emit("call:key", { callId: callResult.call.id, envelopes: await createCallKeyEnvelopes(callResult.call, mediaKey) });
      socket.emit("call:ring", { callId: callResult.call.id });
      navigation.navigate("AudioCall", { callId: callResult.call.id });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCalling(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Button testID="chat-audio-call" title={calling ? "Calling..." : "Audio call"} onPress={startAudioCall} disabled={calling} />
      <FlatList
        inverted
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.messageBubble}>
            {item.plaintext ? <Text>{item.plaintext}</Text> : null}
            <Text>{item.ciphertext.slice(0, 28)}...</Text>
            {item.localStatus === "pending" ? <Text style={styles.muted}>Queued</Text> : null}
            <Text style={styles.muted}>{new Date(item.serverCreatedAt).toLocaleTimeString()}</Text>
          </View>
        )}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.composer}>
        <TextInput testID="chat-message-input" style={[styles.input, { flex: 1 }]} placeholder="Encrypted message" value={text} onChangeText={setText} />
        <Button testID="chat-send" title={sending ? "Sending" : "Send"} onPress={send} disabled={sending} />
      </View>
    </View>
  );
}

function mergeMessages(incoming: Message[], existing: Message[]) {
  const byKey = new Map<string, Message>();
  for (const message of [...existing, ...incoming]) {
    byKey.set(message.clientMessageId || message.id, message);
  }
  return Array.from(byKey.values()).sort((a, b) => new Date(b.serverCreatedAt).getTime() - new Date(a.serverCreatedAt).getTime());
}
