import { useEffect } from "react";
import { getSocket } from "./socket";
import { useSessionStore } from "../state/sessionStore";
import { useCallStore } from "../state/callStore";
import { addNativeCallActionListener, endNativeCall, reportIncomingNativeCall } from "hm-native-calls";
import { navigateToAudioCall } from "../navigation/navigationRef";
import { api } from "./api";
import { leaveAudioRoom } from "./calls";
import { acceptCallKeyEnvelope, clearCallKey } from "./callE2ee";
import { CallE2eeEnvelope } from "../types";

export function useCallSignaling() {
  const session = useSessionStore((state) => state.session);
  const setIncomingCall = useCallStore((state) => state.setIncomingCall);
  const clearIncomingCall = useCallStore((state) => state.clearIncomingCall);
  const clearActiveCall = useCallStore((state) => state.clearActiveCall);

  useEffect(() => {
    if (!session) return;

    const socket = getSocket();
    const incoming = async (payload: { callId: string; callerUserId: string }) => {
      setIncomingCall(payload.callId, payload.callerUserId);
      await reportIncomingNativeCall(payload.callId, `Caller ${payload.callerUserId}`).catch(() => undefined);
    };
    const callKey = async (payload: { callerUserId: string; envelope: CallE2eeEnvelope }) => {
      await acceptCallKeyEnvelope(payload.envelope, payload.callerUserId).catch(() => undefined);
    };
    const clearCallState = () => {
      clearIncomingCall();
      clearActiveCall();
    };
    const rejected = (payload: { callId: string; userId: string; scope?: "DIRECT" | "GROUP" }) => {
      if (payload.scope === "GROUP") {
        const state = useCallStore.getState();
        if (state.incomingCallId === payload.callId) {
          clearIncomingCall();
        }
        return;
      }

      clearCallState();
    };

    socket.on("call:incoming", incoming);
    socket.on("call:key", callKey);
    socket.on("call:rejected", rejected);
    socket.on("call:ended", async (payload: { callId: string }) => {
      await endNativeCall(payload.callId).catch(() => undefined);
      clearCallKey(payload.callId);
      clearCallState();
    });
    const nativeSubscription = addNativeCallActionListener(async (event) => {
      if (event.action === "accept") {
        clearIncomingCall();
        navigateToAudioCall(event.callId);
        return;
      }

      if (event.action === "reject" || event.action === "end") {
        const state = useCallStore.getState();
        const isActiveCall = state.activeCall?.id === event.callId;
        if (isActiveCall) {
          await api.endCall(event.callId).catch(() => undefined);
          getSocket().emit("call:ended", { callId: event.callId });
        } else {
          await api.rejectCall(event.callId).catch(() => undefined);
          const callerUserId = state.incomingCallerUserId;
          if (callerUserId) {
            getSocket().emit("call:rejected", { callId: event.callId, callerUserId });
          }
        }
        await leaveAudioRoom().catch(() => undefined);
        await endNativeCall(event.callId).catch(() => undefined);
        clearCallKey(event.callId);
        clearCallState();
      }
    });

    return () => {
      socket.off("call:incoming", incoming);
      socket.off("call:key", callKey);
      socket.off("call:rejected", rejected);
      socket.off("call:ended");
      nativeSubscription?.remove();
    };
  }, [clearActiveCall, clearIncomingCall, session, setIncomingCall]);
}
