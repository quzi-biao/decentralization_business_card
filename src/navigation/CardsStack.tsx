import React from 'react';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import CardsScreen from '../screens/CardsScreen';
import CardDetailScreen from '../screens/CardDetailScreen';
import { BusinessCardData } from '../store/useCardStore';

export type CardsStackParamList = {
  CardsList: undefined;
  CardDetail: { cardData: BusinessCardData; peerDid?: string; exchangedAt?: number };
};

const Stack = createStackNavigator<CardsStackParamList>();

type CardDetailProps = StackScreenProps<CardsStackParamList, 'CardDetail'>;

const CardDetailWrapper: React.FC<CardDetailProps> = ({ route, navigation }) => {
  return (
    <CardDetailScreen
      cardData={route.params.cardData}
      peerDid={route.params.peerDid}
      exchangedAt={route.params.exchangedAt}
      onClose={() => navigation.goBack()}
    />
  );
};

const CardsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CardsList" component={CardsScreen} />
      <Stack.Screen 
        name="CardDetail" 
        component={CardDetailWrapper}
      />
    </Stack.Navigator>
  );
};

export default CardsStack;
