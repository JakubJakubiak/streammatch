import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { ConvexError } from 'convex/values';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AdCard } from '@/components/ad-card';
import { ProfileCard } from '@/components/profile-card';
import { SwipeCard, type SwipeCardHandle } from '@/components/swipe-card';
import { Avatar, Button, EmptyState, Loading, Screen } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { useBilling } from '@/hooks/use-billing';
import { api, type Id, type PublicProfile } from '@/lib/api';

type NewMatch = { matchId: Id<'matches'>; profile: PublicProfile };

/** Free accounts see an ad in place of every third card. */
const AD_EVERY = 3;

const openPaywall = () => router.push('/paywall');

const isLikeLimit = (error: unknown) =>
  error instanceof ConvexError && (error.data as { code?: string }).code === 'LIKE_LIMIT';

export default function Discover() {
  const deck = useQuery(api.discover.deck);
  const swipe = useMutation(api.swipes.swipe);
  const topCard = useRef<SwipeCardHandle>(null);
  // Hides a card the moment it is swiped, before the server confirms.
  const [dismissed, setDismissed] = useState<Id<'users'>[]>([]);
  const [newMatch, setNewMatch] = useState<NewMatch | null>(null);
  const billing = useBilling();
  // Cards swiped this session, ads included; decides where the next ad goes.
  const [swiped, setSwiped] = useState(0);
  // Bumped to remount the top card when a swipe is refused and it must come back.
  const [retry, setRetry] = useState(0);

  if (deck === undefined || !billing.ready) return <Loading />;
  const cards = deck.filter((profile) => !dismissed.includes(profile.userId));
  const showAd = !billing.isPremium && cards.length > 0 && swiped % AD_EVERY === AD_EVERY - 1;
  const top = cards[0];
  const next = showAd ? top : cards[1];
  const outOfLikes = billing.likesLeft === 0;

  const refuseLike = () => {
    setRetry((n) => n + 1);
    openPaywall();
  };

  const onSwiped = async (profile: PublicProfile, liked: boolean) => {
    if (liked && outOfLikes) return refuseLike();
    setSwiped((n) => n + 1);
    setDismissed((ids) => [...ids, profile.userId]);
    try {
      const { matchId } = await swipe({ toId: profile.userId, liked });
      if (matchId !== null) {
        if (Platform.OS !== 'web') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setNewMatch({ matchId, profile });
      }
    } catch (error) {
      // Put the card back so the swipe is not silently lost.
      setDismissed((ids) => ids.filter((id) => id !== profile.userId));
      if (isLikeLimit(error)) openPaywall();
    }
  };

  const pressLike = () => {
    if (!showAd && outOfLikes) return openPaywall();
    topCard.current?.swipe(true);
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Discover</Text>
        {billing.likesLeft !== null && (
          <Pressable accessibilityRole="button" onPress={openPaywall} style={styles.likesLeft}>
            <Ionicons name="heart" size={14} color={Colors.like} />
            <Text style={styles.likesLeftText}>
              {billing.likesLeft} {billing.likesLeft === 1 ? 'like' : 'likes'} left
            </Text>
          </Pressable>
        )}
      </View>

      {top === undefined ? (
        <EmptyState
          icon="sparkles"
          title="You're all caught up"
          message="No new streamers match your settings. Widen your distance in Profile or check back later."
        />
      ) : (
        <>
          <View style={styles.deck}>
            {next !== undefined && (
              <View key={next.userId} style={[StyleSheet.absoluteFill, styles.nextCard]}>
                <ProfileCard profile={next} />
              </View>
            )}
            {showAd ? (
              <SwipeCard key={`ad-${swiped}`} ref={topCard} onSwiped={() => setSwiped((n) => n + 1)}>
                <AdCard onUpgrade={openPaywall} />
              </SwipeCard>
            ) : (
              <SwipeCard
                key={`${top.userId}-${retry}`}
                ref={topCard}
                onSwiped={(liked) => onSwiped(top, liked)}>
                <Pressable
                  style={styles.fill}
                  onPress={() => router.push({ pathname: '/user/[userId]', params: { userId: top.userId } })}>
                  <ProfileCard profile={top} />
                </Pressable>
              </SwipeCard>
            )}
          </View>

          <View style={styles.actions}>
            <RoundButton icon="close" color={Colors.pass} label="Skip" onPress={() => topCard.current?.swipe(false)} />
            <RoundButton icon="heart" color={Colors.like} label="Like" onPress={pressLike} />
          </View>
        </>
      )}

      <Modal visible={newMatch !== null} transparent animationType="fade" onRequestClose={() => setNewMatch(null)}>
        {newMatch !== null && (
          <View style={styles.matchBackdrop}>
            <Text style={styles.matchTitle}>It&apos;s a match!</Text>
            <Avatar uri={newMatch.profile.avatarUrl} size={140} />
            <Text style={styles.matchText}>You and {newMatch.profile.displayName} liked each other.</Text>
            <Button
              label="Send a message"
              icon="chatbubble"
              style={styles.matchButton}
              onPress={() => {
                setNewMatch(null);
                router.push({ pathname: '/chat/[matchId]', params: { matchId: newMatch.matchId } });
              }}
            />
            <Button label="Keep swiping" variant="secondary" style={styles.matchButton} onPress={() => setNewMatch(null)} />
          </View>
        )}
      </Modal>
    </Screen>
  );
}

function RoundButton({
  icon,
  color,
  label,
  onPress,
}: {
  icon: 'close' | 'heart';
  color: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.round, { borderColor: color }, pressed && styles.roundPressed]}>
      <Ionicons name={icon} size={32} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { color: Colors.text, fontSize: 28, fontWeight: '800' },
  likesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: Colors.surfaceRaised,
  },
  likesLeftText: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  deck: { flex: 1 },
  fill: { flex: 1 },
  nextCard: { transform: [{ scale: 0.96 }], opacity: 0.6 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xl, paddingBottom: Spacing.sm },
  round: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundPressed: { transform: [{ scale: 0.92 }] },
  matchBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(14,14,16,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  matchTitle: { color: Colors.primary, fontSize: 40, fontWeight: '900' },
  matchText: { color: Colors.text, fontSize: 17, textAlign: 'center', marginBottom: Spacing.md },
  matchButton: { alignSelf: 'stretch', maxWidth: 360, width: '100%' },
});
