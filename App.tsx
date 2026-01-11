import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import AssistantScreen from './src/screens/AssistantScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

// Custom icon component using emoji
const TabIcon = ({ emoji, color }: { emoji: string; color: string }) => (
  <Text style={{ fontSize: 24, color }}>{emoji}</Text>
);

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={DarkTheme}>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#ffffff',
              borderTopColor: '#e2e8f0',
              paddingTop: 10,
              height: 90,
            },
            tabBarActiveTintColor: '#64748b',
            tabBarInactiveTintColor: '#cbd5e1',
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 0,
              marginTop: 4,
            }
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarLabel: '名片',
              tabBarIcon: ({ color }) => <TabIcon emoji="💳" color={color} />,
            }}
          />
          <Tab.Screen
            name="Assistant"
            component={AssistantScreen}
            options={{
              tabBarLabel: '名片助手',
              tabBarIcon: ({ color }) => <TabIcon emoji="✨" color={color} />,
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              tabBarLabel: '设置',
              tabBarIcon: ({ color }) => <TabIcon emoji="⚙️" color={color} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
