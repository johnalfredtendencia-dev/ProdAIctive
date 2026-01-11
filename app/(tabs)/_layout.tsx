import { Tabs } from 'expo-router';
import React, { useState } from 'react';

import { LinearGradient } from 'expo-linear-gradient';
import {
    CheckSquare,
    Home,
    Settings,
    Sparkles,
    Timer
} from 'lucide-react-native';
import { View } from 'react-native';
import { ChatBot } from '../../components/ChatBot';

const Theme = {
  primary: '#FF5A5F',
  grayText: '#A0A0A0',
};

export default function TabLayout() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Theme.primary,
          tabBarInactiveTintColor: Theme.grayText,
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#F0F0F0',
            height: 90,
          },
          tabBarShowLabel: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color }) => <Home size={28} color={color} />,
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            tabBarIcon: ({ color }) => <CheckSquare size={28} color={color} />,
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            tabBarIcon: () => (
              <LinearGradient
                colors={[Theme.primary, '#FF8085']}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                  top: -20,
                  shadowColor: Theme.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <Sparkles size={32} color="white" onPress={() => setChatOpen(!chatOpen)} />
              </LinearGradient>
            ),
          }}
        />
        <Tabs.Screen
          name="focus"
          options={{
            tabBarIcon: ({ color }) => <Timer size={28} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            tabBarIcon: ({ color }) => <Settings size={28} color={color} />,
          }}
        />
      </Tabs>
      <ChatBot isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
    </View>
  );
}
