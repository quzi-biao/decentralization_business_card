// IMPORTANT: Import crypto polyfill FIRST before anything else
import './src/polyfills/crypto-polyfill';

import React, { useState, useEffect } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import CardsStack from './src/navigation/CardsStack';
import ProfileStack from './src/navigation/ProfileStack';
import ExchangeScreen from './src/screens/ExchangeScreen';
import EditCardScreen from './src/screens/EditCardScreen';
import InitScreen from './src/screens/InitScreen';
import AIAssistantScreen from './src/screens/AIAssistantScreen';
import { isInitialized } from './src/services/identityService';

const Tab = createBottomTabNavigator();

// Custom icon component using MaterialIcons
const TabIcon = ({ name, color }: { name: any; color: string }) => (
  <MaterialIcons name={name} size={24} color={color} />
);

export default function App() {
  const [initialized, setInitialized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showEditCard, setShowEditCard] = useState(false);

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
              borderTopWidth: 1,
              height: 90,
              paddingBottom: 30,
              paddingTop: 10,
            },
            tabBarActiveTintColor: '#4F46E5',
            tabBarInactiveTintColor: '#94a3b8',
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 0,
              marginTop: 4,
            }
          }}
        >
          <Tab.Screen
            name="Cards"
            component={CardsStack}
            options={{
              tabBarLabel: '名片夹',
              tabBarIcon: ({ color }) => <TabIcon name="contacts" color={color} />,
            }}
          />
          <Tab.Screen
            name="Exchange"
            component={ExchangeScreen}
            options={{
              tabBarLabel: '交换',
              tabBarIcon: ({ color }) => <TabIcon name="swap-horiz" color={color} />,
            }}
          />
          <Tab.Screen
            name="AIAssistant"
            component={AIAssistantScreen}
            options={{
              tabBarLabel: 'AI助手',
              tabBarIcon: ({ color }) => <TabIcon name="smart-toy" color={color} />,
            }}
          />
          <Tab.Screen
            name="Profile"
            options={{
              tabBarLabel: '我的',
              tabBarIcon: ({ color }) => <TabIcon name="person" color={color} />,
            }}
          >
            {() => <ProfileStack onEditPress={() => setShowEditCard(true)} />}
          </Tab.Screen>
        </Tab.Navigator>

        {/* Edit Card Modal */}
        <Modal
          visible={showEditCard}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <EditCardScreen onClose={() => setShowEditCard(false)} />
        </Modal>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
