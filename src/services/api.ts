import { config } from "../config";
import { Call, Conversation, ConversationKeyBundles, LiveKitJoinInfo, Message, RecipientKeyBundle, Session } from "../types";
import { useSessionStore } from "../state/sessionStore";
import { createInitialKeyBundle } from "./crypto/e2ee";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useSessionStore.getState().session?.accessToken;
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message ?? `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  async signup(input: { phone: string; password: string; displayName?: string; platform: string }) {
    const keys = await createInitialKeyBundle();
    return request<Session>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        phone: input.phone,
        password: input.password,
        displayName: input.displayName,
        device: { platform: input.platform },
        keys
      })
    });
  },

  async login(input: { phone: string; password: string; platform: string }) {
    return request<(Session & { mfaRequired: false }) | { mfaRequired: true; userId: string; message: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        phone: input.phone,
        password: input.password,
        device: { platform: input.platform }
      })
    });
  },

  async verifyMfaLogin(input: { userId: string; token?: string; recoveryCode?: string; platform: string }) {
    return request<Session & { mfaRequired: false }>("/auth/mfa/verify-login", {
      method: "POST",
      body: JSON.stringify({
        userId: input.userId,
        token: input.token,
        recoveryCode: input.recoveryCode,
        device: { platform: input.platform }
      })
    });
  },

  mfaSetup: () => request<{ otpauthUrl: string }>("/auth/mfa/setup", { method: "POST" }),
  mfaEnable: (token: string, required: boolean) =>
    request<{ recoveryCodes: string[] }>("/auth/mfa/enable", { method: "POST", body: JSON.stringify({ token, required }) }),

  me: () => request<{ user: Session["user"] }>("/auth/me"),
  searchUsers: (q: string) => request<{ users: Array<{ id: string; phone: string; displayName?: string | null }> }>(`/users/search?q=${encodeURIComponent(q)}`),
  conversations: () => request<{ conversations: Conversation[] }>("/conversations"),
  conversation: (conversationId: string) => request<{ conversation: Conversation }>(`/conversations/${conversationId}`),
  keyBundle: (userId: string) => request<RecipientKeyBundle>(`/keys/${userId}/bundle`),
  conversationKeyBundles: (conversationId: string) => request<ConversationKeyBundles>(`/conversations/${conversationId}/key-bundles`),
  createDirect: (userId: string) => request<{ conversation: Conversation }>("/conversations/direct", { method: "POST", body: JSON.stringify({ userId }) }),
  createGroup: (name: string, memberIds: string[]) => request("/groups", { method: "POST", body: JSON.stringify({ name, memberIds }) }),
  messages: (conversationId: string, cursor?: string) =>
    request<{ messages: Message[]; nextCursor: string | null }>(`/conversations/${conversationId}/messages${cursor ? `?cursor=${cursor}` : ""}`),
  sendMessage: (payload: {
    conversationId: string;
    clientMessageId: string;
    ciphertext: string;
    encryptionHeader: Record<string, unknown>;
    mediaFileId?: string;
  }) => request<{ message: Message }>("/messages", { method: "POST", body: JSON.stringify(payload) }),
  syncMessages: (conversationId: string, after?: string) =>
    request(`/conversations/${conversationId}/sync${after ? `?after=${encodeURIComponent(after)}` : ""}`),
  leaveGroup: (conversationId: string) => request(`/groups/${conversationId}/leave`, { method: "POST" }),
  updateGroup: (conversationId: string, body: { name?: string; avatarMediaId?: string }) =>
    request(`/groups/${conversationId}`, { method: "PATCH", body: JSON.stringify(body) }),
  startDirectCall: (calleeUserId: string, conversationId?: string) =>
    request<{ call: Call; livekit: LiveKitJoinInfo }>("/calls/direct", {
      method: "POST",
      body: JSON.stringify({ calleeUserId, conversationId })
    }),
  startGroupCall: (conversationId: string) =>
    request<{ call: Call; livekit: LiveKitJoinInfo }>("/calls/group", {
      method: "POST",
      body: JSON.stringify({ conversationId })
    }),
  call: (callId: string) => request<{ call: Call }>(`/calls/${callId}`),
  callToken: (callId: string) => request<{ livekit: LiveKitJoinInfo }>(`/calls/${callId}/token`, { method: "POST" }),
  rejectCall: (callId: string) => request(`/calls/${callId}/reject`, { method: "POST" }),
  endCall: (callId: string) => request<{ ok: true; ended: boolean }>(`/calls/${callId}/end`, { method: "POST" }),
  callHistory: () => request<{ calls: Call[] }>("/calls/history"),
  registerPushToken: (body: { deviceId: string; expoPushToken: string; platform: string; appVersion?: string }) =>
    request("/push-tokens", { method: "POST", body: JSON.stringify(body) }),
  unregisterPushTokens: (deviceId: string) => request(`/push-tokens/${deviceId}`, { method: "DELETE" })
};
