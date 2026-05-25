import { requireNativeModule } from "expo-modules-core";

export type E2eeKeyBundle = {
  registrationId?: number;
  identityKey: string;
  signedPreKey: {
    keyId: number;
    publicKey: string;
    signature: string;
  };
  oneTimePreKeys: Array<{
    keyId: number;
    publicKey: string;
  }>;
  kyberPreKeys?: Array<{
    keyId: number;
    publicKey: string;
    signature: string;
  }>;
};

export type EncryptedMessage = {
  ciphertext: string;
  encryptionHeader: Record<string, unknown>;
};

type HmE2eeNativeModule = {
  isAvailable(): Promise<boolean>;
  createInitialKeyBundle(oneTimePreKeyCount: number): Promise<E2eeKeyBundle>;
  encryptMessage(conversationId: string, plaintext: string, recipientBundlesJson: string): Promise<EncryptedMessage>;
  decryptMessage(conversationId: string, ciphertext: string, encryptionHeaderJson: string, senderUserId: string, senderDeviceId: string): Promise<string>;
};

const NativeHmE2ee = requireNativeModule<HmE2eeNativeModule>("HmE2ee");

export async function assertNativeE2eeAvailable() {
  const available = await NativeHmE2ee.isAvailable();
  if (!available) {
    throw new Error("Native Signal/libsignal E2EE provider is not available in this build.");
  }
}

export const HmE2ee = NativeHmE2ee;
