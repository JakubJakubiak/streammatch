// In-app purchases only exist in the native apps.
export type PlanKind = 'weekly' | 'monthly' | 'annual' | 'lifetime' | 'other';
export type Plan = { id: string; kind: PlanKind; price: string; amount: number; currency: string; trialDays: number | null };

export const purchasesAvailable = false;
export const manageSubscriptionUrl = 'https://play.google.com/store/account/subscriptions';

export async function identify(_userId: string) {}

export async function loadPlans(): Promise<Plan[]> {
  return [];
}

export async function buy(_planId: string): Promise<boolean> {
  throw new Error('Purchases are not available on the web');
}

export async function restore() {}
