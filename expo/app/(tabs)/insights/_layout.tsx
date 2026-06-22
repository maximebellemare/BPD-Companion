import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function InsightsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Insights',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
