import { useQuery } from 'convex/react';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';

const MINUTE = 60_000;

/** The current time, refreshed every minute so expiry and the daily reset show up. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), MINUTE);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/**
 * Premium state and the free like allowance. The server enforces both;
 * this only decides what to show.
 */
export function useBilling() {
  const status = useQuery(api.billing.status);
  const now = useNow();
  if (status == null) {
    return { ready: false, isPremium: false, premiumUntil: null, likesLeft: null } as const;
  }
  const isPremium = status.premiumUntil !== null && status.premiumUntil > now;
  const today = new Date(now).toISOString().slice(0, 10);
  const used = status.usageDay === today ? status.usageLikes : 0;
  return {
    ready: true,
    isPremium,
    premiumUntil: isPremium ? status.premiumUntil : null,
    // null means unlimited.
    likesLeft: isPremium ? null : Math.max(0, status.dailyLikes - used),
  } as const;
}
