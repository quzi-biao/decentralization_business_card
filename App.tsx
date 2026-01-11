// IMPORTANT: Import crypto polyfill FIRST before anything else
import './src/polyfills/crypto-polyfill';

import React, { useState, useEffect } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import AssistantScreen from './src/screens/AssistantScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ExchangeScreen from './src/screens/ExchangeScreen';
import CollectionScreen from './src/screens/CollectionScreen';
import InitScreen from './src/screens/InitScreen';
import { isInitialized } from './src/services/identityService';

const Tab = createBottomTabNavigator();

// Custom icon component using emoji
const TabIcon = ({ emoji, color }: { emoji: string; color: string }) => (
  <Text style={{ fontSize: 24, color }}>{emoji}</Text>
);

export default function App() {
  const [initialized, setInitialized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkInitialization();
  }, []);

  const checkInitialization = async () => {
    const init = await isInitialized();
    setInitialized(init);
    setIsChecking(false);
  };

  const handleInitComplete = () => {
    setInitialized(true);
  };

  if (isChecking) {
    return null;
  }

  if (!initialized) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <InitScreen onComplete={handleInitComplete} />
      </SafeAreaProvider>
    );
  }

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
              tabBarLabel: '我的',
              tabBarIcon: ({ color }) => <TabIcon emoji="💳" color={color} />,
            }}
          />
          <Tab.Screen
            name="Exchange"
            component={ExchangeScreen}
            options={{
              tabBarLabel: '交换',
              tabBarIcon: ({ color }) => <TabIcon emoji="🔄" color={color} />,
            }}
          />
          <Tab.Screen
            name="Collection"
            component={CollectionScreen}
            options={{
              tabBarLabel: '收藏',
              tabBarIcon: ({ color }) => <TabIcon emoji="📋" color={color} />,
            }}
          />
          <Tab.Screen
            name="Assistant"
            component={AssistantScreen}
            options={{
              tabBarLabel: '助手',
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
