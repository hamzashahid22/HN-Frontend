import { Room, RoomEvent } from "livekit-client";
import { RNE2EEManager, RNKeyProvider } from "@livekit/react-native";
import { LiveKitJoinInfo } from "../types";
import { getStoredCallKey } from "./callE2ee";

let activeRoom: Room | null = null;

export async function joinAudioRoom(joinInfo: LiveKitJoinInfo, callId: string) {
  if (activeRoom) {
    await activeRoom.disconnect();
  }

  const callKey = getStoredCallKey(callId, joinInfo.e2ee.keyVersion);
  if (!callKey) {
    throw new Error("Missing call E2EE key. Wait for encrypted key exchange before joining.");
  }

  const keyProvider = new RNKeyProvider({ sharedKey: true });
  await keyProvider.setSharedKey(callKey.key, callKey.keyVersion);
  const e2eeManager = new RNE2EEManager(keyProvider);

  const room = new Room({
    adaptiveStream: true,
    dynacast: true,
    e2ee: { e2eeManager }
  });

  room.on(RoomEvent.Disconnected, () => {
    activeRoom = null;
  });

  await room.connect(joinInfo.url, joinInfo.token);
  await room.setE2EEEnabled(true);
  await room.localParticipant.setMicrophoneEnabled(true);
  activeRoom = room;
  return room;
}

export async function leaveAudioRoom() {
  await activeRoom?.disconnect();
  activeRoom = null;
}

export async function setAudioMuted(muted: boolean) {
  if (!activeRoom) {
    throw new Error("No active audio room.");
  }
  await activeRoom.localParticipant.setMicrophoneEnabled(!muted);
}
