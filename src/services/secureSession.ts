import * as SecureStore from "expo-secure-store";
import { Session } from "../types";

const key = "hm.session.v1";

export async function saveSession(session: Session) {
  await SecureStore.setItemAsync(key, JSON.stringify(session));
}

export async function loadSession(): Promise<Session | null> {
  const raw = await SecureStore.getItemAsync(key);
  return raw ? (JSON.parse(raw) as Session) : null;
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(key);
}
