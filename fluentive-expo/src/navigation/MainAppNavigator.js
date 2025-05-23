import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Updates from 'expo-updates';
import React from 'react';
import { IconButton } from 'react-native-paper';

import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SpeakScreen from '../screens/SpeakScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="ProfileMain" 
      component={ProfileScreen}
      options={({ navigation }) => ({
        title: 'Profile',
        headerRight: () => (
          <IconButton
            icon="logout"
            onPress={async () => {
              // Clear user data and token
              await AsyncStorage.multiRemove(['userToken', 'userData']);
              // Reload the app to trigger AppNavigator's token check
              await Updates.reloadAsync();
            }}
          />
        ),
      })}
    />
  </Stack.Navigator>
);

const MainAppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Profile') {
            iconName = 'account';
          } else if (route.name === 'Speak') {
            iconName = 'microphone';
          }

          return <IconButton icon={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Home',
        }}
      />
      <Tab.Screen 
        name="Speak" 
        component={SpeakScreen}
        options={{
          title: 'Speak',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainAppNavigator; 