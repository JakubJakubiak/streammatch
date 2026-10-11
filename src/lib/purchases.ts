import { Platform } from 'react-native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';

export type PlanKind = 'weekly' | 'annual' | 'lifetime' | 'other';
export type Plan = { id: string; kind: PlanKind; price: string };

const KINDS: Record<string, PlanKind> = {
  WEEKLY: 'weekly',
  ANNUAL: 'annual',
  LIFETIME: 'lifetime',
};

// Public SDK keys from the RevenueCat dashboard (safe to ship in the app).
const apiKey = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

/** False until the store keys are set, so the app still runs without billing. */
export const purchasesAvailable = Boolean(apiKey);

export const manageSubscriptionUrl = Platform.select({
  ios: 'https://apps.apple.com/account/subscriptions',
  default: 'https://play.google.com/store/account/subscriptions',
});

let configured = false;
const packages = new Map<string, PurchasesPackage>();

/** Ties store purchases to our user id, which the backend receives from RevenueCat. */
export async function identify(userId: string) {
  if (!apiKey) return;
  if (configured) {
    await Purchases.logIn(userId);
  } else {
    Purchases.configure({ apiKey, appUserID: userId });
    configured = true;
  }
}

export async function loadPlans(): Promise<Plan[]> {
  if (!configured) return [];
  const offerings = await Purchases.getOfferings();
  packages.clear();
  return (offerings.current?.availablePackages ?? []).map((pkg) => {
    packages.set(pkg.identifier, pkg);
    return {
      id: pkg.identifier,
      kind: KINDS[pkg.packageType] ?? 'other',
      price: pkg.product.priceString,
    };
  });
}

/** Resolves false when the user backs out of the store sheet. */
export async function buy(planId: string) {
  const pkg = packages.get(planId);
  if (!pkg) throw new Error('Unknown plan');
  try {
    await Purchases.purchasePackage(pkg);
    return true;
  } catch (error) {
    if ((error as { userCancelled?: boolean }).userCancelled) return false;
    throw error;
  }
}

export async function restore() {
  if (configured) await Purchases.restorePurchases();
}
