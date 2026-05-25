import * as Crypto from "expo-crypto";
import { config } from "../../config";
import { KeyBundle, RecipientKeyBundle } from "../../types";
import { HmE2ee, assertNativeE2eeAvailable } from "hm-e2ee";

export type ConversationCryptoContext = {
  type: "DIRECT" | "GROUP";
  groupSenderKeyVersion?: number | null;
};

function assertCryptoProvider() {
  if (!config.allowInsecureCryptoStub) {
    throw new Error("E2EE provider is not installed. Complete the libsignal crypto spike before using chat.");
  }
}

async function randomKey(label: string) {
  const seed = `${label}:${Date.now()}:${Math.random()}`;
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, seed);
}

export async function createInitialKeyBundle(): Promise<KeyBundle> {
  if (!config.allowInsecureCryptoStub) {
    await assertNativeE2eeAvailable();
    return HmE2ee.createInitialKeyBundle(20);
  }

  assertCryptoProvider();
  // Insecure development stub only. Replace this adapter with libsignal before beta.
  return {
    registrationId: Math.floor(1 + Math.random() * 16380),
    identityKey: await randomKey("identity"),
    signedPreKey: {
      keyId: 1,
      publicKey: await randomKey("signed-pre-key"),
      signature: await randomKey("signature")
    },
    oneTimePreKeys: await Promise.all(
      Array.from({ length: 20 }, async (_, index) => ({
        keyId: index + 1,
        publicKey: await randomKey(`one-time-${index}`)
      }))
    ),
    kyberPreKeys: []
  };
}

export async function encryptMessage(
  plaintext: string,
  conversationId: string,
  recipientBundles: RecipientKeyBundle[],
  context: ConversationCryptoContext = { type: "DIRECT" }
) {
  if (recipientBundles.length === 0) {
    throw new Error("At least one recipient key bundle is required for E2EE.");
  }

  if (!config.allowInsecureCryptoStub) {
    await assertNativeE2eeAvailable();
    return HmE2ee.encryptMessage(conversationId, plaintext, JSON.stringify({ recipientBundles, context }));
  }

  assertCryptoProvider();
  const ciphertext = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${conversationId}:${plaintext}:${Date.now()}`
  );

  return {
    ciphertext,
    encryptionHeader: {
      algorithm: context.type === "GROUP" ? "signal-sender-key-development-stub" : "signal-development-stub",
      mode: context.type === "GROUP" ? "GROUP_SENDER_KEY" : "DIRECT",
      conversationId,
      ...(context.type === "GROUP" ? { groupSenderKeyVersion: context.groupSenderKeyVersion ?? 1 } : {}),
      recipients: recipientBundles.map((bundle) => ({ userId: bundle.userId, deviceId: bundle.deviceId }))
    }
  };
}

export async function decryptMessage(message: {
  conversationId: string;
  ciphertext: string;
  encryptionHeader: Record<string, unknown>;
  senderUserId: string;
  senderDeviceId: string;
}) {
  if (!config.allowInsecureCryptoStub) {
    await assertNativeE2eeAvailable();
    return HmE2ee.decryptMessage(
      message.conversationId,
      message.ciphertext,
      JSON.stringify(message.encryptionHeader),
      message.senderUserId,
      message.senderDeviceId
    );
  }

  assertCryptoProvider();
  return `[encrypted:${message.ciphertext.slice(0, 10)}]`;
}
