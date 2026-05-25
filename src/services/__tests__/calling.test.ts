import { fingerprintCallKey } from "../callE2ee";
import { useCallStore } from "../../state/callStore";

jest.mock("hm-e2ee", () => ({
  assertNativeE2eeAvailable: jest.fn(),
  HmE2ee: {}
}));

describe("call state", () => {
  it("stores and clears incoming calls", () => {
    useCallStore.getState().setIncomingCall("call_1", "user_1");
    expect(useCallStore.getState().incomingCallId).toBe("call_1");
    useCallStore.getState().clearIncomingCall();
    expect(useCallStore.getState().incomingCallId).toBeNull();
  });

  it("stores active LiveKit join info for an outgoing direct call", () => {
    useCallStore.getState().setActiveCall(
      {
        id: "call_1",
        scope: "DIRECT",
        kind: "AUDIO",
        status: "RINGING",
        callerUserId: "user_1",
        livekitRoom: "call_room",
        e2eeKeyVersion: 1,
        startedAt: new Date().toISOString(),
        participants: []
      },
      { url: "wss://livekit.local", room: "call_room", token: "jwt", e2ee: { required: true, keyVersion: 1 } }
    );

    expect(useCallStore.getState().activeCall?.scope).toBe("DIRECT");
    expect(useCallStore.getState().joinInfo?.room).toBe("call_room");
    useCallStore.getState().clearActiveCall();
  });

  it("stores active LiveKit join info for an outgoing group call", () => {
    useCallStore.getState().setActiveCall(
      {
        id: "call_group_1",
        scope: "GROUP",
        kind: "AUDIO",
        status: "RINGING",
        conversationId: "conversation_1",
        callerUserId: "user_1",
        livekitRoom: "group_call_room",
        e2eeKeyVersion: 1,
        startedAt: new Date().toISOString(),
        participants: [
          { id: "p1", userId: "user_1", status: "JOINED" },
          { id: "p2", userId: "user_2", status: "INVITED" }
        ]
      },
      { url: "wss://livekit.local", room: "group_call_room", token: "jwt", e2ee: { required: true, keyVersion: 1 } }
    );

    expect(useCallStore.getState().activeCall?.scope).toBe("GROUP");
    expect(useCallStore.getState().activeCall?.participants).toHaveLength(2);
    useCallStore.getState().clearActiveCall();
  });

  it("derives stable call E2EE key fingerprints without exposing key material", async () => {
    const one = await fingerprintCallKey("media-key");
    const two = await fingerprintCallKey("media-key");
    expect(one).toBe(two);
    expect(one).not.toContain("media-key");
  });
});
