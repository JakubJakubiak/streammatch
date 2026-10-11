import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation, useQuery } from 'convex/react';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { ProfileForm, type ProfileDraft } from '@/components/profile-form';
import { Avatar, Button, Chip, Loading, Screen } from '@/components/ui';
import { DISTANCES, distanceLabel } from '@/constants/options';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useBilling } from '@/hooks/use-billing';
import { useLocation } from '@/hooks/use-location';
import { api } from '@/lib/api';
import { confirm } from '@/lib/confirm';
import { compactNumber, twitchUrl } from '@/lib/format';
import { manageSubscriptionUrl } from '@/lib/purchases';

export default function Profile() {
  const me = useQuery(api.profiles.me);
  const update = useMutation(api.profiles.update);
  const clearLocation = useMutation(api.profiles.clearLocation);
  const deleteAccount = useMutation(api.profiles.deleteAccount);
  const { signOut } = useAuthActions();
  const location = useLocation();
  const billing = useBilling();

  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [saving, setSaving] = useState(false);

  if (me == null) return <Loading />;
  const current = draft ?? { bio: me.bio, intent: me.intent, tags: me.tags };

  const save = async () => {
    setSaving(true);
    try {
      await update(current);
      setDraft(null);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const confirmed = await confirm(
      'Delete account?',
      billing.isPremium
        ? 'Your profile, matches and messages will be permanently removed. This does not cancel your Premium subscription — cancel it in your store account first.'
        : 'Your profile, matches and messages will be permanently removed.',
      'Delete',
    );
    if (confirmed) await deleteAccount();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Avatar uri={me.avatarUrl} size={84} />
          <View style={styles.headerText}>
            <Text style={styles.name}>{me.displayName}</Text>
            <Text style={styles.muted}>
              @{me.login}
              {me.followerCount !== null && ` · ${compactNumber(me.followerCount)} followers`}
            </Text>
          </View>
        </View>
        {me.linkedToTwitch && (
          <Button
            label="Open my Twitch channel"
            icon="logo-twitch"
            variant="secondary"
            onPress={() => void Linking.openURL(twitchUrl(me.login))}
          />
        )}

        {me.bioRemoved && (
          <Text style={styles.warning}>
            Your bio was removed because it broke our rules. Please write a new one.
          </Text>
        )}
        <ProfileForm draft={current} onChange={setDraft} />
        {draft !== null && <Button label="Save changes" onPress={save} busy={saving} />}

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Premium</Text>
          {billing.isPremium ? (
            <>
              <Text style={styles.muted}>
                {billing.premiumUntil === Number.MAX_SAFE_INTEGER
                  ? 'Forever plan'
                  : `Active until ${new Date(billing.premiumUntil ?? 0).toLocaleDateString()}`}
                . Unlimited likes, no ads.
              </Text>
              <Button
                label="Manage subscription"
                variant="secondary"
                onPress={() => void Linking.openURL(manageSubscriptionUrl)}
              />
            </>
          ) : (
            <>
              <Text style={styles.muted}>
                {billing.likesLeft ?? 0} of your free likes left today. Go Premium for unlimited
                likes and no ads.
              </Text>
              <Button label="Get Premium" icon="star" onPress={() => router.push('/paywall')} />
            </>
          )}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Discovery</Text>

          <Text style={styles.muted}>Maximum distance</Text>
          <View style={styles.chips}>
            {DISTANCES.map((km) => (
              <Chip
                key={String(km)}
                label={distanceLabel(km)}
                selected={me.maxDistanceKm === km}
                onPress={() => void update({ maxDistanceKm: km })}
              />
            ))}
          </View>
          {!me.hasLocation && me.maxDistanceKm !== null && (
            <Text style={styles.muted}>Distance only applies once you share your location.</Text>
          )}

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.switchLabel}>Share my location</Text>
              <Text style={styles.muted}>Rounded to about 1 km. Others only see the distance.</Text>
            </View>
            <Switch
              value={me.hasLocation}
              disabled={location.busy}
              onValueChange={(on) => void (on ? location.request() : clearLocation())}
              trackColor={{ true: Colors.primary, false: Colors.surfaceRaised }}
            />
          </View>
          {location.denied && (
            <Text style={styles.muted}>Location access was denied in your device settings.</Text>
          )}

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.switchLabel}>Show me in Discover</Text>
              <Text style={styles.muted}>Turn off to hide your profile from new people.</Text>
            </View>
            <Switch
              value={me.discoverable}
              onValueChange={(discoverable) => void update({ discoverable })}
              trackColor={{ true: Colors.primary, false: Colors.surfaceRaised }}
            />
          </View>
        </View>

        <Button label="Sign out" variant="secondary" onPress={() => void signOut()} />
        <Button label="Delete account" variant="danger" onPress={remove} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: Spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerText: { flex: 1, gap: Spacing.xs },
  name: { color: Colors.text, fontSize: 24, fontWeight: '800' },
  muted: { color: Colors.textMuted, fontSize: 14, lineHeight: 19 },
  warning: { color: Colors.pass, fontSize: 14, lineHeight: 19 },
  panel: {
    padding: Spacing.md,
    gap: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  panelTitle: { color: Colors.text, fontSize: 17, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  switchText: { flex: 1, gap: 2 },
  switchLabel: { color: Colors.text, fontSize: 15, fontWeight: '600' },
});
