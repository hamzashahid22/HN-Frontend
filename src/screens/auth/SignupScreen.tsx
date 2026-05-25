import { useState } from "react";
import { Button, Platform, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { api } from "../../services/api";
import { useSessionStore } from "../../state/sessionStore";
import { styles } from "../styles";

export function SignupScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Signup">) {
  const setSession = useSessionStore((state) => state.setSession);
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    try {
      setError(null);
      const session = await api.signup({ phone, password, displayName, platform: Platform.OS });
      await setSession(session);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Create your account</Text>
      <TextInput testID="signup-display-name" style={styles.input} placeholder="Display name" value={displayName} onChangeText={setDisplayName} />
      <TextInput testID="signup-phone" style={styles.input} placeholder="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput testID="signup-password" style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button testID="signup-submit" title="Sign up" onPress={submit} />
      <Button testID="signup-login" title="Already have an account" onPress={() => navigation.navigate("Login")} />
    </View>
  );
}
