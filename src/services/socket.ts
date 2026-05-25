import { io, Socket } from "socket.io-client";
import { config } from "../config";
import { useSessionStore } from "../state/sessionStore";

let socket: Socket | null = null;

export function getSocket() {
  const session = useSessionStore.getState().session;
  if (!session) throw new Error("Missing session");

  if (!socket) {
    socket = io(config.apiBaseUrl, {
      transports: ["websocket"],
      auth: { token: session.accessToken },
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000
    });
  }

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
