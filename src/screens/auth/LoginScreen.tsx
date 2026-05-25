import { useState } from "react";
import { Button, Platform, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { api } from "../../services/api";
import { useSessionStore } from "../../state/sessionStore";
import { styles } from "../styles";

export function LoginScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Login">) {
  const setSession = useSessionStore((state) => state.setSession);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    try {
      setError(null);
      const session = await api.login({ phone, password, platform: Platform.OS });
      if (session.mfaRequired) {
        navigation.navigate("Mfa", { userId: session.userId });
        return;
      }
      await setSession(session);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Welcome back</Text>
      <TextInput testID="login-phone" style={styles.input} placeholder="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput testID="login-password" style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button testID="login-submit" title="Log in" onPress={submit} />
      <Button testID="login-create-account" title="Create account" onPress={() => navigation.navigate("Signup")} />
    </View>
  );
}
