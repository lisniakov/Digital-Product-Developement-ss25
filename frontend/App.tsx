// App.tsx
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import FallDetailsScreen from './src/screens/FallDetailsScreen';
import FallIncidentReportScreen from './src/screens/FallIncidentReportScreen';
import ResidentRecordScreen from './src/screens/ResidentRecordScreen';
import ResidentConditionScreen from './src/screens/ResidentConditionScreen';
import VitalMeasurementsScreen from './src/screens/VitalMeasurementsScreen';
import AidsPresentScreen from './src/screens/AidsPresentScreen';
import InjuryAssessmentScreen from './src/screens/InjuryAssessmentScreen';
import FirstAidOfferedScreen from './src/screens/FirstAidOfferedScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProfileEditScreen from './src/screens/ProfileEditScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';
import PasswordManagerScreen from './src/screens/PasswordManagerScreen';

export type RootStackParamList = {
  Home: { updatedProfile?: any } | undefined;
  FallDetails: { resident: any };
  ResidentCondition: { resident: any; placeOfFall?: any };
  VitalMeasurements: { resident: any; condition: string; placeOfFall: any };
  NurseReport: { resident: any; placeOfFall: any; condition: string; vitals: any };
  FallIncidentReport: { resident: any; placeOfFall: any; condition: string; vitals: any };
  ResidentRecord: { residentId: string };
  AidsPresent: { resident: any; condition: string; placeOfFall: any; vitals: any};
  InjuryAssessment: {resident: any; condition: string; placeOfFall: any; vitals: any; aidsPresent: string[];};
  FirstAidOffered: { resident: any; condition: string; placeOfFall: any; vitals: any; aidsPresent: string[]; injuries: string[];};
  Profile: { profile?: any; updatedProfile?: any } | undefined;
  ProfileEdit: { profile?: any } | undefined;
  Settings: undefined;
  NotificationSettings: undefined;
  PasswordManager: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="FallDetails" 
          component={FallDetailsScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ResidentCondition" 
          component={ResidentConditionScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="VitalMeasurements" 
          component={VitalMeasurementsScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="FallIncidentReport" 
          component={FallIncidentReportScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ResidentRecord" 
          component={ResidentRecordScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="AidsPresent" 
          component={AidsPresentScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="InjuryAssessment" 
          component={InjuryAssessmentScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="FirstAidOffered" 
          component={FirstAidOfferedScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ProfileEdit" 
          component={ProfileEditScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="NotificationSettings" 
          component={NotificationSettingsScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PasswordManager" 
          component={PasswordManagerScreen} 
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;