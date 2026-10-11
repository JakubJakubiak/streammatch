import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { ProfileRow } from '@/components/profile-row';
import { EmptyState, Loading, Screen } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/format';

export default function Matches() {
  const matches = useQuery(api.matches.list);

  return (
    <Screen>
      <Text style={styles.heading}>Matches</Text>
      {matches === undefined ? (
        <Loading />
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(match) => match.matchId}
          contentContainerStyle={matches.length === 0 && styles.emptyList}
          ListEmptyComponent={
            <EmptyState
              icon="heart-outline"
              title="No matches yet"
              message="When you and another streamer like each other, you can chat here."
            />
          }
          renderItem={({ item }) => (
            <ProfileRow
              profile={item.other}
              detail={item.lastMessageText ?? 'Say hi 👋'}
              emphasized={item.unread}
              trailing={
                <View style={styles.trailing}>
                  <Text style={styles.time}>{timeAgo(item.lastActivityAt)}</Text>
                  {item.unread && <View style={styles.dot} />}
                </View>
              }
              onPress={() => router.push({ pathname: '/chat/[matchId]', params: { matchId: item.matchId } })}
            />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { color: Colors.text, fontSize: 28, fontWeight: '800', padding: Spacing.md },
  emptyList: { flexGrow: 1 },
  trailing: { alignItems: 'flex-end', gap: 6 },
  time: { color: Colors.textMuted, fontSize: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
});
