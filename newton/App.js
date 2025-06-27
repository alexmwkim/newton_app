import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import TabNavigator from './src/navigation/TabNavigator';

export default function App() {
  return (
    <>
      <TabNavigator />
      <StatusBar style="auto" />
    </>
  );
}
