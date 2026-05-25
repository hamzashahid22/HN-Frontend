import { Button, Text, View } from "react-native";
import { useSessionStore } from "../../state/sessionStore";
import { disconnectSocket } from "../../services/socket";
import { styles } from "../styles";

export function ProfileScreen() {
  const session = useSessionStore((state) => state.session);
  const logout = useSessionStore((state) => state.logout);

  async function submitLogout() {
    disconnectSocket();
    await logout();
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{session?.user.displayName ?? "Profile"}</Text>
      <Text style={styles.muted}>{session?.user.phone}</Text>
      <Text style={styles.muted}>Device: {session?.device.id}</Text>
      <Button title="Log out" onPress={submitLogout} />
    </View>
  );
}
