import { create } from "zustand";
import { Call, LiveKitJoinInfo } from "../types";

type CallState = {
  activeCall: Call | null;
  incomingCallId: string | null;
  incomingCallerUserId: string | null;
  joinInfo: LiveKitJoinInfo | null;
  setActiveCall: (call: Call, joinInfo: LiveKitJoinInfo) => void;
  setIncomingCall: (callId: string, callerUserId: string) => void;
  clearActiveCall: () => void;
  clearIncomingCall: () => void;
};

export const useCallStore = create<CallState>((set) => ({
  activeCall: null,
  incomingCallId: null,
  incomingCallerUserId: null,
  joinInfo: null,
  setActiveCall: (activeCall, joinInfo) => set({ activeCall, joinInfo }),
  setIncomingCall: (incomingCallId, incomingCallerUserId) => set({ incomingCallId, incomingCallerUserId }),
  clearActiveCall: () => set({ activeCall: null, joinInfo: null }),
  clearIncomingCall: () => set({ incomingCallId: null, incomingCallerUserId: null })
}));
