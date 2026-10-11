import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { ProfileRow } from '@/components/profile-row';
import { Button, Chip, EmptyState, Loading, Screen } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { useLocation } from '@/hooks/use-location';
import { api, type PublicProfile } from '@/lib/api';

const RADII = [10, 25, 50, 100, 300];

const detailOf = (profile: PublicProfile) =>
  profile.isLive && profile.gameName !== null
    ? `Streaming ${profile.gameName}`
    : profile.bio || `@${profile.login}`;

export default function Nearby() {
  const [radiusKm, setRadiusKm] = useState(50);
  const [liveOnly, setLiveOnly] = useState(false);
  const streamers = useQuery(api.discover.nearby, { radiusKm, liveOnly });
  const location = useLocation();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.heading}>Nearby</Text>
        <View style={styles.filters}>
          {RADII.map((km) => (
            <Chip key={km} label={`${km} km`} selected={radiusKm === km} onPress={() => setRadiusKm(km)} />
          ))}
          <Chip label="Live now" icon="radio" selected={liveOnly} onPress={() => setLiveOnly(!liveOnly)} />
        </View>
      </View>

      {streamers === undefined ? (
        <Loading />
      ) : streamers === null ? (
        <EmptyState
          icon="location"
          title="See who streams near you"
          message={
            location.denied
              ? 'Location access was denied. Enable it in your device settings to use Nearby.'
              : 'Share your approximate location to find streamers around you. Only the distance is ever shown to others.'
          }>
          <Button label="Share location" icon="location" onPress={location.request} busy={location.busy} />
        </EmptyState>
      ) : (
        <FlatList
          data={streamers}
          keyExtractor={(profile) => profile.userId}
          contentContainerStyle={streamers.length === 0 && styles.emptyList}
          ListEmptyComponent={
            <EmptyState
              icon="search"
              title="Nobody here yet"
              message={`No ${liveOnly ? 'live ' : ''}streamers within ${radiusKm} km. Try a wider radius.`}
            />
          }
          renderItem={({ item }) => (
            <ProfileRow
              profile={item}
              detail={detailOf(item)}
              trailing={<Text style={styles.distance}>{item.distanceKm} km</Text>}
              onPress={() => router.push({ pathname: '/user/[userId]', params: { userId: item.userId } })}
            />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: Spacing.md, gap: Spacing.md },
  heading: { color: Colors.text, fontSize: 28, fontWeight: '800' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  emptyList: { flexGrow: 1 },
  distance: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
});
