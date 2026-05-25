import { useState } from "react";
import { Button, Platform, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { api } from "../../services/api";
import { useSessionStore } from "../../state/sessionStore";
import { styles } from "../styles";

export function MfaScreen({ route }: NativeStackScreenProps<RootStackParamList, "Mfa">) {
  const setSession = useSessionStore((state) => state.setSession);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function verify() {
    try {
      setError(null);
      const session = await api.verifyMfaLogin({ userId: route.params.userId, token: code, platform: Platform.OS });
      await setSession(session);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Verification</Text>
      <Text style={styles.muted}>Enter your authenticator code.</Text>
      <TextInput style={styles.input} placeholder="Code" keyboardType="number-pad" value={code} onChangeText={setCode} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Verify" onPress={verify} />
    </View>
  );
}
