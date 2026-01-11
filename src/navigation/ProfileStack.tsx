import React from 'react';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import ProfileScreen from '../screens/ProfileScreen';
import CardDetailScreen from '../screens/CardDetailScreen';
import { BusinessCardData } from '../store/useCardStore';

export type ProfileStackParamList = {
    ProfileMain: undefined;
    CardDetail: { cardData: BusinessCardData };
};

const Stack = createStackNavigator<ProfileStackParamList>();

const ProfileStack = ({ onEditPress }: { onEditPress: () => void }) => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="ProfileMain">
                {(props) => <ProfileScreen {...props} onEditPress={onEditPress} />}
            </Stack.Screen>
            <Stack.Screen name="CardDetail">
                {({ route, navigation }: StackScreenProps<ProfileStackParamList, 'CardDetail'>) => (
                    <CardDetailScreen 
                        cardData={route.params.cardData}
                        onClose={() => navigation.goBack()}
                    />
                )}
            </Stack.Screen>
        </Stack.Navigator>
    );
};

export default ProfileStack;
