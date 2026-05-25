import * as Crypto from "expo-crypto";
import { Call, CallE2eeEnvelope, RecipientKeyBundle } from "../types";
import { decryptMessage, encryptMessage } from "./crypto/e2ee";
import { api } from "./api";
import { useSessionStore } from "../state/sessionStore";

type StoredCallKey = {
  key: string;
  keyVersion: number;
  keyFingerprint: string;
};

const callKeys = new Map<string, StoredCallKey>();

async function randomCallKey() {
  const seed = `${Date.now()}:${Math.random()}:${Math.random()}`;
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA512, seed);
}

export async function fingerprintCallKey(key: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `homenet-call-e2ee:${key}`);
}

export async function createAndStoreCallKey(call: Call) {
  const key = await randomCallKey();
  const keyFingerprint = await fingerprintCallKey(key);
  const stored = { key, keyVersion: call.e2eeKeyVersion, keyFingerprint };
  callKeys.set(call.id, stored);
  return stored;
}

export function getStoredCallKey(callId: string, expectedVersion?: number) {
  const stored = callKeys.get(callId);
  if (!stored) return null;
  if (expectedVersion && stored.keyVersion !== expectedVersion) return null;
  return stored;
}

export function clearCallKey(callId: string) {
  callKeys.delete(callId);
}

export async function createCallKeyEnvelopes(call: Call, mediaKey: StoredCallKey): Promise<CallE2eeEnvelope[]> {
  const session = useSessionStore.getState().session;
  if (!session) throw new Error("Missing session");

  const recipientUserIds = call.participants
    .map((participant) => participant.userId)
    .filter((userId) => userId !== session.user.id);
  const recipientBundles = await Promise.all(recipientUserIds.map((userId) => api.keyBundle(userId)));

  return Promise.all(
    recipientBundles.map(async (bundle) => {
      const encrypted = await encryptCallKeyForRecipient(call, mediaKey, bundle);
      return {
        callId: call.id,
        conversationId: call.conversationId ?? null,
        keyVersion: mediaKey.keyVersion,
        keyFingerprint: mediaKey.keyFingerprint,
        recipientUserId: bundle.userId,
        recipientDeviceId: bundle.deviceId,
        ciphertext: encrypted.ciphertext,
        encryptionHeader: encrypted.encryptionHeader
      };
    })
  );
}

async function encryptCallKeyForRecipient(call: Call, mediaKey: StoredCallKey, bundle: RecipientKeyBundle) {
  return encryptMessage(
    JSON.stringify({
      type: "CALL_MEDIA_KEY",
      callId: call.id,
      keyVersion: mediaKey.keyVersion,
      key: mediaKey.key,
      keyFingerprint: mediaKey.keyFingerprint
    }),
    call.conversationId ?? call.id,
    [bundle],
    { type: "DIRECT" }
  );
}

export async function acceptCallKeyEnvelope(envelope: CallE2eeEnvelope, senderUserId: string, senderDeviceId = "call-signaling") {
  const plaintext = await decryptMessage({
    conversationId: envelope.conversationId ?? envelope.callId,
    ciphertext: envelope.ciphertext,
    encryptionHeader: envelope.encryptionHeader,
    senderUserId,
    senderDeviceId
  });
  const parsed = JSON.parse(plaintext) as {
    type: string;
    callId: string;
    keyVersion: number;
    key: string;
    keyFingerprint: string;
  };
  if (parsed.type !== "CALL_MEDIA_KEY" || parsed.callId !== envelope.callId || parsed.keyVersion !== envelope.keyVersion) {
    throw new Error("Invalid call E2EE envelope.");
  }
  const fingerprint = await fingerprintCallKey(parsed.key);
  if (fingerprint !== parsed.keyFingerprint || fingerprint !== envelope.keyFingerprint) {
    throw new Error("Call E2EE key fingerprint mismatch.");
  }

  callKeys.set(envelope.callId, {
    key: parsed.key,
    keyVersion: parsed.keyVersion,
    keyFingerprint: parsed.keyFingerprint
  });
}
