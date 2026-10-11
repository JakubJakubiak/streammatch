import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, LiveBadge } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import type { PublicProfile } from '@/lib/api';

/** A list row: avatar, name, one line of detail, and an optional trailing element. */
export function ProfileRow({
  profile,
  detail,
  trailing,
  emphasized = false,
  onPress,
}: {
  profile: PublicProfile;
  detail: string;
  trailing?: ReactNode;
  emphasized?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Avatar uri={profile.avatarUrl} size={56} />
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {profile.displayName}
          </Text>
          {profile.isLive && <LiveBadge />}
        </View>
        <Text style={[styles.detail, emphasized && styles.detailEmphasized]} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  pressed: { backgroundColor: Colors.surface },
  body: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { color: Colors.text, fontSize: 16, fontWeight: '700', flexShrink: 1 },
  detail: { color: Colors.textMuted, fontSize: 14 },
  detailEmphasized: { color: Colors.text, fontWeight: '600' },
});
