import { Ionicons } from '@expo/vector-icons';
import { useAction } from 'convex/react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Loading, Screen } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useBilling } from '@/hooks/use-billing';
import { api } from '@/lib/api';
import {
  buy,
  loadPlans,
  purchasesAvailable,
  restore,
  type Plan,
  type PlanKind,
} from '@/lib/purchases';

const GRADIENT = ['#9146FF', '#FF5C8A'] as const;

const BENEFITS = [
  { icon: 'heart', title: 'Unlimited likes', text: 'No daily cap. Swipe as long as you want.' },
  { icon: 'eye-off', title: 'No ads', text: 'Only real people in your deck.' },
  { icon: 'rocket', title: 'Back the project', text: 'Help us ship new features faster.' },
] as const;

const PLAN_NAMES: Record<PlanKind, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  annual: 'Yearly',
  lifetime: 'Forever',
  other: 'Premium',
};

// Shown only while the store is not connected, so the screen can be reviewed.
// Real prices always come from the App Store / Google Play.
const PREVIEW: [PlanKind, number, number | null][] = [
  ['weekly', 14.99, 3],
  ['monthly', 49.99, null],
  ['lifetime', 499, null],
];

const ORDER: PlanKind[] = ['weekly', 'monthly', 'annual', 'lifetime', 'other'];

const WEEKS_PER_YEAR = 52;
/** How many weeks one payment of a renewing plan covers. */
const WEEKS_COVERED: Partial<Record<PlanKind, number>> = {
  weekly: 1,
  monthly: WEEKS_PER_YEAR / 12,
  annual: WEEKS_PER_YEAR,
};

const RENEWS: Partial<Record<PlanKind, string>> = {
  weekly: 'per week',
  monthly: 'per month',
  annual: 'per year',
};

const perWeek = (plan: Plan) => {
  const weeks = WEEKS_COVERED[plan.kind];
  return weeks === undefined ? null : plan.amount / weeks;
};

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);

const PREVIEW_PLANS: Plan[] = PREVIEW.map(([kind, amount, trialDays]) => ({
  id: `preview_${kind}`,
  kind,
  price: money(amount, 'USD'),
  amount,
  currency: 'USD',
  trialDays,
}));

/**
 * The small print and badge for a plan, worked out from the store prices:
 * renewing plans are compared by cost per week against the priciest one,
 * and the one-time plan against how long the monthly plan would take to cost the same.
 */
function describe(plan: Plan, plans: Plan[]): { note: string; badge?: string } {
  if (plan.kind === 'lifetime') {
    const monthly = plans.find((other) => other.kind === 'monthly');
    const months = monthly ? Math.ceil(plan.amount / monthly.amount) : null;
    return {
      note:
        months === null
          ? 'One payment. No renewals, ever.'
          : `One payment. Pays for itself after ${months} months.`,
      badge: 'LEGEND',
    };
  }
  const weekly = perWeek(plan);
  if (weekly === null) return { note: '' };
  const highest = Math.max(...plans.map((other) => perWeek(other) ?? 0));
  const saving = Math.round((1 - weekly / highest) * 100);
  if (plan.trialDays !== null) {
    return {
      note: `${plan.trialDays} days free, then ${plan.price} ${RENEWS[plan.kind] ?? ''}`.trim(),
      badge: `${plan.trialDays} DAYS FREE`,
    };
  }
  return {
    note:
      plan.kind === 'weekly'
        ? 'Billed every week.'
        : `${money(weekly, plan.currency)} per week`,
    badge: saving > 0 ? `SAVE ${saving}%` : undefined,
  };
}

const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

export default function Paywall() {
  const billing = useBilling();
  const refresh = useAction(api.billing.refresh);
  const [plans, setPlans] = useState<Plan[] | null>(purchasesAvailable ? null : PREVIEW_PLANS);
  const [selected, setSelected] = useState<string | null>(
    purchasesAvailable ? null : 'preview_monthly',
  );
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!purchasesAvailable) return;
    let active = true;
    loadPlans()
      .catch(() => [])
      .then((loaded) => {
        if (!active) return;
        const sorted = [...loaded].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
        setPlans(sorted);
        setSelected((sorted.find((plan) => plan.kind === 'monthly') ?? sorted[0])?.id ?? null);
      });
    return () => {
      active = false;
    };
  }, []);

  // The store takes the money; our server decides who is premium.
  const confirmWithServer = async () => {
    const { premium } = await refresh().catch(() => ({ premium: false }));
    if (premium) return close();
    setMessage('Purchase received. Premium will unlock in a moment — you can close this screen.');
  };

  const run = async (kind: 'buy' | 'restore', action: () => Promise<boolean>, failure: string) => {
    setBusy(kind);
    setMessage(null);
    try {
      if (await action()) await confirmWithServer();
    } catch {
      setMessage(failure);
    } finally {
      setBusy(null);
    }
  };

  const purchase = () =>
    run('buy', () => buy(selected!), 'The purchase could not be completed. You were not charged.');
  const restorePurchases = () =>
    run(
      'restore',
      async () => {
        await restore();
        return true;
      },
      'Could not restore purchases. Please try again.',
    );

  const chosen = plans?.find((plan) => plan.id === selected);
  const canBuy = purchasesAvailable && !billing.isPremium && chosen !== undefined && busy === null;

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <LinearGradient colors={['#3B1D80', Colors.background]} style={styles.hero}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={12}
            onPress={close}
            style={styles.close}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </Pressable>
          <LinearGradient colors={GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.badge}>
            <Ionicons name="star" size={40} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>StreamMatch Premium</Text>
          <Text style={styles.subtitle}>
            {billing.isPremium ? 'You are a Premium member. Thank you!' : 'Match without limits.'}
          </Text>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.benefits}>
            {BENEFITS.map((benefit) => (
              <View key={benefit.title} style={styles.benefit}>
                <View style={styles.benefitIcon}>
                  <Ionicons name={benefit.icon} size={20} color={Colors.primary} />
                </View>
                <View style={styles.benefitText}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.muted}>{benefit.text}</Text>
                </View>
              </View>
            ))}
          </View>

          {plans === null ? (
            <Loading />
          ) : plans.length === 0 ? (
            <Text style={styles.notice}>No plans are available right now. Please try again later.</Text>
          ) : (
            <View accessibilityRole="radiogroup" style={styles.plans}>
              {plans.map((plan) => {
                const copy = describe(plan, plans);
                const isSelected = plan.id === selected;
                return (
                  <Pressable
                    key={plan.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => setSelected(plan.id)}
                    style={[styles.plan, isSelected && styles.planSelected]}>
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color={isSelected ? Colors.primary : Colors.textMuted}
                    />
                    <View style={styles.planText}>
                      <View style={styles.planNameRow}>
                        <Text style={styles.planName}>{PLAN_NAMES[plan.kind]}</Text>
                        {copy.badge !== undefined && (
                          <LinearGradient
                            colors={GRADIENT}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.planBadge}>
                            <Text style={styles.planBadgeText}>{copy.badge}</Text>
                          </LinearGradient>
                        )}
                      </View>
                      {copy.note !== '' && <Text style={styles.muted}>{copy.note}</Text>}
                    </View>
                    <Text style={styles.planPrice}>{plan.price}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {!purchasesAvailable && (
            <Text style={styles.notice}>
              Preview prices. Purchases are not connected in this build yet.
            </Text>
          )}
          {message !== null && <Text style={styles.notice}>{message}</Text>}

          {!billing.isPremium && (
            <>
              <Pressable
                accessibilityRole="button"
                disabled={!canBuy}
                onPress={purchase}
                style={({ pressed }) => [(pressed || !canBuy) && styles.dimmed]}>
                <LinearGradient colors={GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
                  {busy === 'buy' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.ctaLabel}>
                      {chosen === undefined
                        ? 'Continue'
                        : chosen.trialDays !== null
                          ? `Start ${chosen.trialDays}-day free trial`
                          : `Continue · ${chosen.price}`}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={!purchasesAvailable || busy !== null}
                onPress={restorePurchases}
                style={styles.restore}>
                {busy === 'restore' ? (
                  <ActivityIndicator color={Colors.textMuted} />
                ) : (
                  <Text style={styles.restoreLabel}>Restore purchases</Text>
                )}
              </Pressable>

              <Text style={styles.legal}>
                Weekly and monthly plans renew automatically until cancelled. Cancel any time in your
                store account settings. A free trial becomes a paid subscription unless cancelled
                at least 24 hours before it ends. The Forever plan is a one-time purchase.
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  hero: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.xl + Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  close: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: { color: Colors.text, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: Colors.textMuted, fontSize: 16, textAlign: 'center' },
  body: { padding: Spacing.lg, gap: Spacing.lg },
  benefits: { gap: Spacing.md },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceRaised,
  },
  benefitText: { flex: 1, gap: 2 },
  benefitTitle: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  muted: { color: Colors.textMuted, fontSize: 13, lineHeight: 18 },
  plans: { gap: Spacing.sm },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  planSelected: { borderColor: Colors.primary, backgroundColor: '#211536' },
  planText: { flex: 1, gap: 2 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  planName: { color: Colors.text, fontSize: 17, fontWeight: '700' },
  planBadge: { borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  planBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  planPrice: { color: Colors.text, fontSize: 18, fontWeight: '800' },
  notice: { color: Colors.textMuted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  cta: {
    minHeight: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  ctaLabel: { color: '#fff', fontSize: 17, fontWeight: '800' },
  dimmed: { opacity: 0.5 },
  restore: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  restoreLabel: { color: Colors.textMuted, fontSize: 15, fontWeight: '600' },
  legal: { color: Colors.textMuted, fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
