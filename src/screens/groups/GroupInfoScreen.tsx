import { Text, View } from "react-native";
import { styles } from "../styles";

export function GroupInfoScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Group info</Text>
      <Text style={styles.muted}>Member management is supported by the backend endpoints and ready for UI expansion.</Text>
    </View>
  );
}
