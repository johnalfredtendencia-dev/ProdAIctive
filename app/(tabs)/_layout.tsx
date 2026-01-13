import { Tabs } from 'expo-router';
import { useState } from 'react';

import { LinearGradient } from 'expo-linear-gradient';
import {
  CheckSquare,
  Home,
  Settings,
  Sparkles,
  Timer
} from 'lucide-react-native';
import { TouchableOpacity, View } from 'react-native';
import { ChatBot } from '../../components/ChatBot';
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
  const { colors, isDarkMode } = useTheme();
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.grayText,
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            backgroundColor: colors.navBarBg,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            height: 60,
            justifyContent: 'center',
            alignItems: 'center',
          },
          tabBarItemStyle: {
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 0,
            paddingHorizontal: 0,
          },
          tabBarShowLabel: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color }: { color: string }) => <Home size={28} color={color} />,
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            tabBarIcon: ({ color }: { color: string }) => <CheckSquare size={28} color={color} />,
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            tabBarIcon: () => (
              <TouchableOpacity onPress={() => setChatOpen(!chatOpen)}>
                <LinearGradient
                  colors={colors.primaryGradient}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    justifyContent: 'center',
                    alignItems: 'center',
                    top: -20,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  <Sparkles size={32} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            ),
          }}
        />
        <Tabs.Screen
          name="focus"
          options={{
            tabBarIcon: ({ color }: { color: string }) => <Timer size={28} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            tabBarIcon: ({ color }: { color: string }) => <Settings size={28} color={color} />,
          }}
        />
      </Tabs>
      <ChatBot isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
    </View>
  );
}
