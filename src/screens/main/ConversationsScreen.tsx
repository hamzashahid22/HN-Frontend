import { useQuery } from "@tanstack/react-query";
import { FlatList, Pressable, Text, View } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { api } from "../../services/api";
import { Conversation } from "../../types";
import { styles } from "../styles";

export function ConversationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const query = useQuery({ queryKey: ["conversations"], queryFn: api.conversations });
  const conversations = (query.data?.conversations ?? []) as Conversation[];

  return (
    <View style={styles.screen}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.muted}>No chats yet.</Text>}
        renderItem={({ item }) => (
          <Pressable testID={`conversation-${item.id}`} style={styles.row} onPress={() => navigation.navigate("Chat", { conversationId: item.id, title: item.group?.name ?? "Chat" })}>
            <Text style={styles.rowTitle}>{item.group?.name ?? item.type}</Text>
            <Text style={styles.muted}>{item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleString() : "No messages yet"}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
