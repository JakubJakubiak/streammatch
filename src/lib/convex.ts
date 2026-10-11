import { ConvexReactClient } from 'convex/react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

// Auth tokens go to the keychain on native; the web falls back to localStorage.
export const tokenStorage =
  Platform.OS === 'web'
    ? undefined
    : {
        getItem: SecureStore.getItemAsync,
        setItem: SecureStore.setItemAsync,
        removeItem: SecureStore.deleteItemAsync,
      };
