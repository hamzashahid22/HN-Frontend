import { useEffect } from "react";
import { create } from "zustand";
import { Session } from "../types";
import { clearSession, loadSession, saveSession } from "../services/secureSession";

type SessionState = {
  bootstrapped: boolean;
  session: Session | null;
  setSession: (session: Session) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
};

export const useSessionStore = create<SessionState>((set) => ({
  bootstrapped: false,
  session: null,
  setSession: async (session) => {
    await saveSession(session);
    set({ session });
  },
  logout: async () => {
    await clearSession();
    set({ session: null });
  },
  bootstrap: async () => {
    const session = await loadSession();
    set({ session, bootstrapped: true });
  }
}));

export function useSessionBootstrap() {
  const bootstrap = useSessionStore((state) => state.bootstrap);
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);
}
