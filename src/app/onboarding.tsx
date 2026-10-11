import { useAuthActions } from '@convex-dev/auth/react';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ProfileForm, type ProfileDraft } from '@/components/profile-form';
import { Avatar, Button, Loading, Screen } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useLocation } from '@/hooks/use-location';
import { api } from '@/lib/api';

export default function Onboarding() {
  const me = useQuery(api.profiles.me);
  const update = useMutation(api.profiles.update);
  const { signOut } = useAuthActions();
  const location = useLocation();

  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [isAdult, setIsAdult] = useState(false);
  const [saving, setSaving] = useState(false);

  if (me == null) return <Loading />;
  // Start from what Twitch gave us, until the user edits something.
  const current = draft ?? { bio: me.bio, intent: me.intent, tags: me.tags };

  const finish = async () => {
    setSaving(true);
    try {
      await update({ ...current, confirmAdult: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Avatar uri={me.avatarUrl} size={72} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Hey, {me.displayName}!</Text>
            <Text style={styles.subtitle}>Set up your profile to start matching.</Text>
          </View>
        </View>

        <ProfileForm draft={current} onChange={setDraft} />

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Streamers near you</Text>
          <Text style={styles.panelText}>
            Share your approximate location (rounded to about 1 km) to see who streams nearby. You
            can turn this off any time.
          </Text>
          {me.hasLocation ? (
            <View style={styles.done}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.like} />
              <Text style={styles.doneText}>Location shared</Text>
            </View>
          ) : (
            <Button
              label="Share location"
              icon="location"
              variant="secondary"
              onPress={location.request}
              busy={location.busy}
            />
          )}
          {location.denied && (
            <Text style={styles.panelText}>
              Location is unavailable. You can still browse streamers from anywhere.
            </Text>
          )}
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isAdult }}
          onPress={() => setIsAdult(!isAdult)}
          style={styles.checkRow}>
          <Ionicons
            name={isAdult ? 'checkbox' : 'square-outline'}
            size={24}
            color={isAdult ? Colors.primary : Colors.textMuted}
          />
          <Text style={styles.checkLabel}>I confirm that I am 18 or older.</Text>
        </Pressable>

        <Button label="Start matching" onPress={finish} disabled={!isAdult} busy={saving} />
        <Button label="Sign out" variant="secondary" onPress={() => void signOut()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerText: { flex: 1, gap: Spacing.xs },
  title: { color: Colors.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: Colors.textMuted, fontSize: 15 },
  panel: {
    padding: Spacing.md,
    gap: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  panelTitle: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  panelText: { color: Colors.textMuted, fontSize: 14, lineHeight: 20 },
  done: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  doneText: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  checkLabel: { color: Colors.text, fontSize: 15, flex: 1 },
});
