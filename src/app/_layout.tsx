import { ConvexAuthProvider, useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth, useQuery } from 'convex/react';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Loading } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { api } from '@/lib/api';
import { convex, tokenStorage } from '@/lib/convex';
import { identify } from '@/lib/purchases';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    border: Colors.border,
  },
};

function RootNavigator() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const me = useQuery(api.profiles.me, isAuthenticated ? {} : 'skip');
  const ready = !isLoading && (!isAuthenticated || me !== undefined);

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  // A session whose profile is gone (deleted account) cannot do anything useful.
  useEffect(() => {
    if (isAuthenticated && me === null) void signOut();
  }, [isAuthenticated, me, signOut]);

  // Purchases are made under our user id so the backend can match them.
  const userId = me?.userId;
  useEffect(() => {
    if (userId) void identify(userId).catch(() => {});
  }, [userId]);

  if (!ready) return <Loading />;

  const signedIn = isAuthenticated && me != null;
  const onboarded = signedIn && me.onboarded;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[matchId]" />
        <Stack.Screen name="user/[userId]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ConvexAuthProvider client={convex} storage={tokenStorage}>
        <ThemeProvider value={theme}>
          <StatusBar style="light" />
          <RootNavigator />
        </ThemeProvider>
      </ConvexAuthProvider>
    </GestureHandlerRootView>
  );
}
