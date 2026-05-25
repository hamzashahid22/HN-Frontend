import { EventEmitter, Subscription, requireOptionalNativeModule } from "expo-modules-core";

export type NativeCallAction = {
  action: "accept" | "reject" | "end";
  callId: string;
};

type HmNativeCallsModule = {
  isAvailable(): Promise<boolean>;
  reportIncomingCall(callId: string, callerName: string, hasVideo: boolean): Promise<void>;
  endCall(callId: string): Promise<void>;
};

const NativeCalls = requireOptionalNativeModule<HmNativeCallsModule>("HmNativeCalls");
const emitter = NativeCalls ? new EventEmitter(NativeCalls as never) : null;

export async function reportIncomingNativeCall(callId: string, callerName: string) {
  if (!NativeCalls) {
    throw new Error("Native call UI is not linked in this build.");
  }
  const available = await NativeCalls.isAvailable();
  if (!available) {
    throw new Error("Native call UI is not available in this build.");
  }
  await NativeCalls.reportIncomingCall(callId, callerName, false);
}

export async function endNativeCall(callId: string) {
  if (!NativeCalls) return;
  const available = await NativeCalls.isAvailable();
  if (available) await NativeCalls.endCall(callId);
}

export function addNativeCallActionListener(listener: (event: NativeCallAction) => void): Subscription | null {
  return emitter?.addListener<NativeCallAction>("onCallAction", listener) ?? null;
}
