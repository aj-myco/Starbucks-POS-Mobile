import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function CashierLayout() {
  return (
    <LinearGradient colors={['#036635', '#00754A']} style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false, 
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </LinearGradient>
  );
}
