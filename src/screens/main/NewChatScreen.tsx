import { useState } from "react";
import { Button, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { api } from "../../services/api";
import { styles } from "../styles";
import { RootStackParamList } from "../../navigation/RootNavigator";

export function NewChatScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [userId, setUserId] = useState("");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<Array<{ id: string; phone: string; displayName?: string | null }>>([]);
  const [groupName, setGroupName] = useState("");
  const [memberIds, setMemberIds] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function createDirect() {
    const result = await api.createDirect(userId);
    setStatus("Direct chat created.");
    navigation.navigate("Chat", { conversationId: result.conversation.id, title: "Direct chat" });
  }

  async function createGroup() {
    await api.createGroup(groupName, memberIds.split(",").map((id) => id.trim()).filter(Boolean));
    setStatus("Group created.");
  }

  async function search() {
    const result = await api.searchUsers(query);
    setUsers(result.users);
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Start a chat</Text>
      <TextInput testID="new-chat-search" style={styles.input} placeholder="Search by phone or name" value={query} onChangeText={setQuery} />
      <Button testID="new-chat-search-submit" title="Search users" onPress={search} />
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => setUserId(item.id)}>
            <Text style={styles.rowTitle}>{item.displayName ?? item.phone}</Text>
            <Text style={styles.muted}>{item.id}</Text>
          </Pressable>
        )}
      />
      <TextInput testID="new-chat-user-id" style={styles.input} placeholder="User ID" value={userId} onChangeText={setUserId} />
      <Button testID="new-chat-create-direct" title="Create direct chat" onPress={createDirect} />
      <Text style={styles.titleSmall}>New group</Text>
      <TextInput testID="new-chat-group-name" style={styles.input} placeholder="Group name" value={groupName} onChangeText={setGroupName} />
      <TextInput testID="new-chat-group-members" style={styles.input} placeholder="Member IDs, comma separated" value={memberIds} onChangeText={setMemberIds} />
      <Button testID="new-chat-create-group" title="Create group" onPress={createGroup} />
      {status ? <Text style={styles.muted}>{status}</Text> : null}
    </View>
  );
}
