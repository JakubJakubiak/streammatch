import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Avatar, EmptyState, LiveBadge, Loading, Screen } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { api, type Id } from '@/lib/api';

export default function Chat() {
  const { matchId } = useLocalSearchParams<{ matchId: Id<'matches'> }>();
  const match = useQuery(api.matches.get, { matchId });
  const messages = useQuery(api.messages.list, match ? { matchId } : 'skip');
  const send = useMutation(api.messages.send);
  const markRead = useMutation(api.messages.markRead);
  const [text, setText] = useState('');

  // Everything on screen counts as read, including messages arriving while open.
  const newest = messages?.[0]?.id;
  useEffect(() => {
    if (match) void markRead({ matchId });
  }, [match, matchId, markRead, newest]);

  if (match === undefined) return <Loading />;
  if (match === null) {
    return (
      <Screen>
        <BackButton />
        <EmptyState icon="heart-dislike" title="Match unavailable" message="This conversation no longer exists." />
      </Screen>
    );
  }

  const submit = async () => {
    const body = text.trim();
    if (body === '') return;
    setText('');
    try {
      await send({ matchId, body });
    } catch {
      setText(body);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton />
        <Pressable
          style={styles.headerProfile}
          onPress={() => router.push({ pathname: '/user/[userId]', params: { userId: match.other.userId } })}>
          <Avatar uri={match.other.avatarUrl} size={40} />
          <Text style={styles.headerName} numberOfLines={1}>
            {match.other.displayName}
          </Text>
          {match.other.isLive && <LiveBadge />}
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {messages === undefined ? (
          <Loading />
        ) : (
          <FlatList
            inverted
            data={messages}
            keyExtractor={(message) => message.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.mine ? styles.mine : styles.theirs]}>
                <Text style={styles.bubbleText}>{item.body}</Text>
              </View>
            )}
          />
        )}

        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={`Message ${match.other.displayName}`}
            placeholderTextColor={Colors.textMuted}
            maxLength={1000}
            multiline
            style={styles.input}
            onSubmitEditing={submit}
            submitBehavior="submit"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            disabled={text.trim() === ''}
            onPress={submit}
            style={[styles.send, text.trim() === '' && styles.sendDisabled]}>
            <Ionicons name="arrow-up" size={22} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function BackButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={12}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/matches'))}
      style={styles.back}>
      <Ionicons name="chevron-back" size={26} color={Colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  back: { padding: Spacing.sm },
  headerProfile: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerName: { color: Colors.text, fontSize: 17, fontWeight: '700', flexShrink: 1 },
  list: { padding: Spacing.md, gap: Spacing.sm },
  bubble: {
    maxWidth: '80%',
    paddingVertical: Spacing.sm,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  mine: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: Colors.surfaceRaised, borderBottomLeftRadius: 4 },
  bubbleText: { color: Colors.text, fontSize: 16, lineHeight: 21 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    color: Colors.text,
    fontSize: 16,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
});
