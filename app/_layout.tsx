import { Stack } from 'expo-router/stack';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';

import { SessionProvider } from '@/lib/session';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Gabarito: require('../assets/fonts/Gabarito-Variable.ttf'),
    Piazzolla: require('../assets/fonts/Piazzolla-Variable.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.canvas,
        }}
      >
        <ActivityIndicator color={colors.espresso as string} />
      </View>
    );
  }

  return (
    <SessionProvider>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            title: "Capsule",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth"
          options={{
            title: "Sign in",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: false,
          }}
        />
      </Stack>
    </SessionProvider>
  );
}
