import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Chip, LiveBadge } from '@/components/ui';
import { intentLabel } from '@/constants/options';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { PublicProfile } from '@/lib/api';
import { compactNumber } from '@/lib/format';

export function ProfileMeta({ profile }: { profile: PublicProfile }) {
  const facts = [
    profile.distanceKm !== null && `${profile.distanceKm} km away`,
    profile.followerCount !== null && `${compactNumber(profile.followerCount)} followers`,
    intentLabel(profile.intent),
  ].filter(Boolean);
  return <Text style={styles.meta}>{facts.join(' · ')}</Text>;
}

/** The big card shown in the swipe deck. */
export function ProfileCard({ profile }: { profile: PublicProfile }) {
  return (
    <View style={styles.card}>
      {profile.avatarUrl !== null && (
        <Image
          source={profile.avatarUrl}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          blurRadius={30}
        />
      )}
      <LinearGradient
        colors={['rgba(14,14,16,0.2)', 'rgba(14,14,16,0.55)', 'rgba(14,14,16,0.97)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.hero}>
        <View style={profile.isLive && styles.liveRing}>
          <Avatar uri={profile.avatarUrl} size={168} />
        </View>
      </View>

      <View style={styles.info}>
        {profile.isLive && (
          <View style={styles.liveRow}>
            <LiveBadge viewers={profile.viewerCount} />
            {profile.gameName !== null && (
              <Text style={styles.game} numberOfLines={1}>
                {profile.gameName}
              </Text>
            )}
          </View>
        )}
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {profile.displayName}
          </Text>
          {profile.broadcasterType === 'partner' && (
            <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
          )}
        </View>
        <ProfileMeta profile={profile} />
        {profile.bio !== '' && (
          <Text style={styles.bio} numberOfLines={3}>
            {profile.bio}
          </Text>
        )}
        {profile.tags.length > 0 && (
          <View style={styles.tags}>
            {profile.tags.map((tag) => (
              <Chip key={tag} label={tag} selected={profile.sharedTags.includes(tag)} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  liveRing: {
    padding: 4,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: Colors.live,
  },
  info: { padding: Spacing.lg, gap: Spacing.sm },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  game: { color: Colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { color: Colors.text, fontSize: 30, fontWeight: '800', flexShrink: 1 },
  meta: { color: Colors.textMuted, fontSize: 14 },
  bio: { color: Colors.text, fontSize: 15, lineHeight: 21 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
