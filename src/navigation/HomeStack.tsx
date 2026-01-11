import React from 'react';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import CardDetailScreen from '../screens/CardDetailScreen';
import { BusinessCardData } from '../store/useCardStore';

export type HomeStackParamList = {
  Home: undefined;
  CardDetail: { cardData: BusinessCardData };
};

const Stack = createStackNavigator<HomeStackParamList>();

type CardDetailProps = StackScreenProps<HomeStackParamList, 'CardDetail'>;

const CardDetailWrapper: React.FC<CardDetailProps> = ({ route, navigation }) => {
  return (
    <CardDetailScreen
      cardData={route.params.cardData}
      onClose={() => navigation.goBack()}
    />
  );
};

const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen 
        name="CardDetail" 
        component={CardDetailWrapper}
      />
    </Stack.Navigator>
  );
};

export default HomeStack;
