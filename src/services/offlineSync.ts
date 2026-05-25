import NetInfo from "@react-native-community/netinfo";
import { Message } from "../types";
import { api } from "./api";
import { decryptMessage, encryptMessage } from "./crypto/e2ee";
import { getSocket } from "./socket";
import { useSessionStore } from "../state/sessionStore";
import {
  cacheConversationKeyContext,
  cacheMessages,
  enqueueOutboundMessage,
  getCachedConversationKeyContext,
  getCachedMessages,
  getOutboundMessages,
  getSyncCursor,
  removeOutboundMessage,
  setSyncCursor
} from "../storage/localDb";

type EncryptedOutboundPayload = {
  conversationId: string;
  clientMessageId: string;
  ciphertext: string;
  encryptionHeader: Record<string, unknown>;
  mediaFileId?: string;
};

export async function loadCachedConversationMessages(conversationId: string) {
  return getCachedMessages(conversationId);
}

export async function buildEncryptedOutboundPayload(conversationId: string, plaintext: string, clientMessageId: string): Promise<EncryptedOutboundPayload> {
  let keyContext = await api.conversationKeyBundles(conversationId)
    .then(async (result) => {
      await cacheConversationKeyContext(result);
      return result;
    })
    .catch(async () => getCachedConversationKeyContext(conversationId));

  if (!keyContext) {
    throw new Error("No cached E2EE key bundle for offline send. Open this conversation online once before sending offline.");
  }

  const encrypted = await encryptMessage(plaintext, conversationId, keyContext.recipientBundles, {
    type: keyContext.type,
    groupSenderKeyVersion: keyContext.groupSenderKeyVersion
  });

  return { conversationId, clientMessageId, ...encrypted };
}

export async function sendEncryptedPayload(payload: EncryptedOutboundPayload) {
  const socket = getSocket();
  if (socket.connected) {
    return new Promise<Message>((resolve, reject) => {
      socket.emit("message:send", payload, (ack?: { ok: boolean; message?: Message; messageText?: string; errorMessage?: string }) => {
        if (!ack?.ok || !ack.message) {
          reject(new Error(ack?.messageText ?? ack?.errorMessage ?? "Message send failed"));
          return;
        }
        resolve(ack.message);
      });
    });
  }

  return (await api.sendMessage(payload)).message;
}

export async function queueMessage(conversationId: string, plaintext: string, payload: EncryptedOutboundPayload, lastError?: string) {
  await enqueueOutboundMessage({
    clientMessageId: payload.clientMessageId,
    conversationId,
    plaintext,
    encryptedPayload: payload,
    lastError
  });
  const session = useSessionStore.getState().session;
  await cacheMessages([
    {
      id: `local:${payload.clientMessageId}`,
      conversationId,
      senderUserId: session?.user.id ?? "local",
      senderDeviceId: session?.device.id ?? "local",
      clientMessageId: payload.clientMessageId,
      ciphertext: payload.ciphertext,
      encryptionHeader: payload.encryptionHeader,
      plaintext,
      localStatus: "pending",
      serverCreatedAt: new Date().toISOString()
    }
  ]);
}

export async function flushOutboundQueue(conversationId?: string) {
  const queued = await getOutboundMessages(conversationId);
  const sent: Message[] = [];

  for (const item of queued) {
    try {
      const message = await sendEncryptedPayload(item.encryptedPayload);
      const withPlaintext = { ...message, plaintext: item.plaintext, localStatus: "sent" as const };
      await cacheMessages([withPlaintext]);
      await removeOutboundMessage(item.clientMessageId);
      sent.push(withPlaintext);
    } catch {
      // Keep the item queued; the next reconnect will retry with the same clientMessageId.
    }
  }

  return sent;
}

export async function syncConversation(conversationId: string) {
  const after = await getSyncCursor(conversationId);
  const result = await api.syncMessages(conversationId, after ?? undefined) as { messages: Message[]; latestCursor: string | null };
  const decrypted = await Promise.all(
    result.messages.map(async (message) => ({
      ...message,
      plaintext: await decryptMessage(message).catch(() => undefined),
      localStatus: "sent" as const
    }))
  );
  await cacheMessages(decrypted);
  await setSyncCursor(conversationId, result.latestCursor ? new Date(result.latestCursor).toISOString() : after);
  return decrypted;
}

export function subscribeToReconnectFlush(onFlush?: (messages: Message[]) => void) {
  const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      void flushOutboundQueue().then((messages) => {
        if (messages.length) onFlush?.(messages);
      });
    }
  });

  let socketCleanup: (() => void) | undefined;
  try {
    const socket = getSocket();
    const onConnect = () => {
      void flushOutboundQueue().then((messages) => {
        if (messages.length) onFlush?.(messages);
      });
    };
    socket.on("connect", onConnect);
    socketCleanup = () => socket.off("connect", onConnect);
  } catch {
    socketCleanup = undefined;
  }

  return () => {
    unsubscribeNetInfo();
    socketCleanup?.();
  };
}
