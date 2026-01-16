// IMPORTANT: Import crypto polyfill FIRST before anything else
import './src/polyfills/crypto-polyfill';

import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeConfig } from './src/constants/theme';

import CardsStack from './src/navigation/CardsStack';
import ProfileStack from './src/navigation/ProfileStack';
import ExchangeScreen from './src/screens/ExchangeScreen';
import EditCardScreen from './src/screens/EditCardScreen';
import InitScreen from './src/screens/InitScreen';
import AIAssistantScreen from './src/screens/AIAssistantScreen';
import { isInitialized } from './src/services/identityService';
import { useCardStore } from './src/store/useCardStore';

const Tab = createBottomTabNavigator();

// Custom icon component using MaterialIcons
const TabIcon = ({ name, color }: { name: any; color: string }) => (
  <MaterialIcons name={name} size={24} color={color} />
);

export default function App() {
  const [initialized, setInitialized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showEditCard, setShowEditCard] = useState(false);
  const loadData = useCardStore(state => state.loadData);

  useEffect(() => {
    checkInitialization();
  }, []);

  const checkInitialization = async () => {
    const init = await isInitialized();
    setInitialized(init);
    
    // 如果已初始化，加载持久化数据
    if (init) {
      await loadData();
    }
    
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
        <StatusBar style="dark" />
        <InitScreen onComplete={handleInitComplete} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={DefaultTheme}>
        <StatusBar style="dark" />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: ThemeConfig.colors.background,
              borderTopColor: ThemeConfig.colors.border,
              borderTopWidth: ThemeConfig.borderWidth.thin,
              height: 90,
              paddingBottom: 30,
              paddingTop: 10,
            },
            tabBarActiveTintColor: ThemeConfig.colors.primary,
            tabBarInactiveTintColor: ThemeConfig.colors.textTertiary,
            tabBarLabelStyle: {
              fontSize: ThemeConfig.fontSize.xs,
              fontWeight: ThemeConfig.fontWeight.semibold,
              letterSpacing: 0,
              marginTop: 4,
            },
            lazy: false,
            detachInactiveScreens: false,
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
