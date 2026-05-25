import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ConversationsScreen } from "../screens/main/ConversationsScreen";
import { NewChatScreen } from "../screens/main/NewChatScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";
import { CallsScreen } from "../screens/calls/CallsScreen";

const Tab = createBottomTabNavigator();

export function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Chats" component={ConversationsScreen} />
      <Tab.Screen name="Calls" component={CallsScreen} />
      <Tab.Screen name="New Chat" component={NewChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
