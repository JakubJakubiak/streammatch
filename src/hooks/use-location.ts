import { useMutation } from 'convex/react';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';

type Coordinates = { lat: number; lng: number };

/** Reads the device position, or null when permission is missing or it fails. */
async function readPosition(askPermission: boolean): Promise<Coordinates | null> {
  try {
    const permission = askPermission
      ? await Location.requestForegroundPermissionsAsync()
      : await Location.getForegroundPermissionsAsync();
    if (!permission.granted) return null;
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low,
    });
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch {
    return null;
  }
}

/**
 * Shares the device position with the backend (which stores it rounded to ~1 km).
 * `request` asks for permission. With `refreshOnMount`, the stored position is
 * silently updated for people who already granted it.
 */
export function useLocation({ refreshOnMount = false } = {}) {
  const setLocation = useMutation(api.profiles.setLocation);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!refreshOnMount) return;
    void readPosition(false).then((position) => position && setLocation(position));
  }, [refreshOnMount, setLocation]);

  const request = async () => {
    setBusy(true);
    const position = await readPosition(true);
    if (position !== null) await setLocation(position).catch(() => {});
    setDenied(position === null);
    setBusy(false);
  };

  return { request, busy, denied };
}
