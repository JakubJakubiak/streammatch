import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ProfileMeta } from '@/components/profile-card';
import { Avatar, Button, Chip, EmptyState, LiveBadge, Loading, Screen } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { api, type Id } from '@/lib/api';
import { confirm } from '@/lib/confirm';
import { twitchUrl } from '@/lib/format';

const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

export default function UserProfile() {
  const { userId } = useLocalSearchParams<{ userId: Id<'users'> }>();
  const profile = useQuery(api.profiles.get, { userId });
  const block = useMutation(api.safety.block);
  const report = useMutation(api.safety.report);

  if (profile === undefined) return <Loading />;

  const blockUser = async (alsoReport: boolean) => {
    if (profile === null) return;
    const confirmed = await confirm(
      alsoReport ? 'Report and block?' : 'Block this user?',
      `You and ${profile.displayName} will no longer see each other, and any match will be removed.`,
      alsoReport ? 'Report' : 'Block',
    );
    if (!confirmed) return;
    if (alsoReport) await report({ userId, reason: 'Reported from profile' });
    await block({ userId });
    close();
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} onPress={close} style={styles.close}>
        <Ionicons name="close" size={26} color={Colors.text} />
      </Pressable>

      {profile === null ? (
        <EmptyState icon="person-remove" title="Profile unavailable" message="This streamer can no longer be viewed." />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Avatar uri={profile.avatarUrl} size={140} />
            <Text style={styles.name}>{profile.displayName}</Text>
            <ProfileMeta profile={profile} />
          </View>

          {profile.isLive && (
            <View style={styles.livePanel}>
              <View style={styles.liveRow}>
                <LiveBadge viewers={profile.viewerCount} />
                {profile.gameName !== null && <Text style={styles.game}>{profile.gameName}</Text>}
              </View>
              {profile.streamTitle !== null && <Text style={styles.streamTitle}>{profile.streamTitle}</Text>}
            </View>
          )}

          {profile.bio !== '' && <Text style={styles.bio}>{profile.bio}</Text>}

          {profile.tags.length > 0 && (
            <View style={styles.tags}>
              {profile.tags.map((tag) => (
                <Chip key={tag} label={tag} selected={profile.sharedTags.includes(tag)} />
              ))}
            </View>
          )}

          <Button
            label={profile.isLive ? 'Watch on Twitch' : 'Open Twitch channel'}
            icon="logo-twitch"
            onPress={() => void Linking.openURL(twitchUrl(profile.login))}
          />
          <Button label="Block" variant="secondary" onPress={() => void blockUser(false)} />
          <Button label="Report and block" variant="danger" onPress={() => void blockUser(true)} />
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  close: { alignSelf: 'flex-end', padding: Spacing.md },
  content: { padding: Spacing.lg, paddingTop: 0, gap: Spacing.lg },
  hero: { alignItems: 'center', gap: Spacing.sm },
  name: { color: Colors.text, fontSize: 28, fontWeight: '800' },
  livePanel: {
    padding: Spacing.md,
    gap: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  game: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  streamTitle: { color: Colors.textMuted, fontSize: 15, lineHeight: 20 },
  bio: { color: Colors.text, fontSize: 16, lineHeight: 23 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
