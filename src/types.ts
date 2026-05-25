export type User = {
  id: string;
  phone: string;
  displayName?: string | null;
  mfaPolicy?: "OFF" | "OPTIONAL" | "REQUIRED";
};

export type Device = {
  id: string;
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: User;
  device: Device;
};

export type Conversation = {
  id: string;
  type: "DIRECT" | "GROUP";
  memberIds: string[];
  group?: { id: string; name: string; senderKeyVersion?: number; senderKeyRotatedAt?: string } | null;
  lastMessageAt?: string | null;
};

export type Message = {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderDeviceId: string;
  clientMessageId: string;
  ciphertext: string;
  encryptionHeader: Record<string, unknown>;
  plaintext?: string;
  localStatus?: "pending" | "sent" | "failed";
  serverCreatedAt: string;
};

export type Call = {
  id: string;
  scope: "DIRECT" | "GROUP";
  kind: "AUDIO";
  status: "RINGING" | "ACCEPTED" | "MISSED" | "REJECTED" | "ENDED";
  conversationId?: string | null;
  callerUserId: string;
  livekitRoom: string;
  e2eeKeyVersion: number;
  startedAt: string;
  acceptedAt?: string | null;
  endedAt?: string | null;
  participants: Array<{
    id: string;
    userId: string;
    status: "INVITED" | "JOINED" | "DECLINED" | "LEFT" | "MISSED";
  }>;
};

export type LiveKitJoinInfo = {
  url: string;
  room: string;
  token: string;
  e2ee: {
    required: true;
    keyVersion: number;
  };
};

export type CallE2eeEnvelope = {
  callId: string;
  conversationId?: string | null;
  keyVersion: number;
  keyFingerprint: string;
  recipientUserId: string;
  recipientDeviceId: string;
  ciphertext: string;
  encryptionHeader: Record<string, unknown>;
};

export type KeyBundle = {
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

export type RecipientKeyBundle = {
  userId: string;
  deviceId: string;
  registrationId?: number;
  identityKey: string;
  signedPreKey: {
    keyId: number;
    publicKey: string;
    signature: string;
  };
  oneTimePreKey?: {
    keyId: number;
    publicKey: string;
  } | null;
  kyberPreKey?: {
    keyId: number;
    publicKey: string;
    signature: string;
  } | null;
};

export type ConversationKeyBundles = {
  conversationId: string;
  type: "DIRECT" | "GROUP";
  groupSenderKeyVersion: number | null;
  groupSenderKeyRotatedAt: string | null;
  recipientBundles: RecipientKeyBundle[];
};
