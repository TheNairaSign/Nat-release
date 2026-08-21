import { Tabs } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'home',
};

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={() => null}
      screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="impact" options={{ title: 'Impact' }} />
      <Tabs.Screen name="where" options={{ title: 'Where' }} />
      <Tabs.Screen name="profile" options={{ title: 'You' }} />
    </Tabs>
  );
}
