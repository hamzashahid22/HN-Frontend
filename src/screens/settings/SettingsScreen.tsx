import { useState } from "react";
import { Button, Switch, Text, TextInput, View } from "react-native";
import { registerPushNotifications, unregisterPushNotifications } from "../../services/push";
import { api } from "../../services/api";
import { styles } from "../styles";

export function SettingsScreen() {
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [required, setRequired] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  async function setupMfa() {
    const result = await api.mfaSetup();
    setOtpauthUrl(result.otpauthUrl);
  }

  async function enableMfa() {
    const result = await api.mfaEnable(mfaCode, required);
    setRecoveryCodes(result.recoveryCodes);
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Settings</Text>
      <Button title="Enable push notifications" onPress={registerPushNotifications} />
      <Button title="Disable push notifications" onPress={unregisterPushNotifications} />
      <Text style={styles.titleSmall}>MFA</Text>
      <Button title="Start authenticator setup" onPress={setupMfa} />
      {otpauthUrl ? <Text style={styles.muted}>{otpauthUrl}</Text> : null}
      <TextInput style={styles.input} placeholder="Authenticator code" value={mfaCode} onChangeText={setMfaCode} keyboardType="number-pad" />
      <View style={styles.switchRow}>
        <Text>Require MFA on login</Text>
        <Switch value={required} onValueChange={setRequired} />
      </View>
      <Button title="Enable MFA" onPress={enableMfa} />
      {recoveryCodes.map((code) => <Text key={code} style={styles.muted}>{code}</Text>)}
    </View>
  );
}
