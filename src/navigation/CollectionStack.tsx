import React from 'react';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import CollectionScreen from '../screens/CollectionScreen';
import CardDetailScreen from '../screens/CardDetailScreen';
import { BusinessCardData } from '../store/useCardStore';

export type CollectionStackParamList = {
  CollectionList: undefined;
  CardDetail: { cardData: BusinessCardData };
};

const Stack = createStackNavigator<CollectionStackParamList>();

type CardDetailProps = StackScreenProps<CollectionStackParamList, 'CardDetail'>;

const CardDetailWrapper: React.FC<CardDetailProps> = ({ route, navigation }) => {
  return (
    <CardDetailScreen
      cardData={route.params.cardData}
      onClose={() => navigation.goBack()}
    />
  );
};

const CollectionStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CollectionList" component={CollectionScreen} />
      <Stack.Screen 
        name="CardDetail" 
        component={CardDetailWrapper}
      />
    </Stack.Navigator>
  );
};

export default CollectionStack;
