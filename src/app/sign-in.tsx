import { useAuthActions } from '@convex-dev/auth/react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Button, Screen } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';

WebBrowser.maybeCompleteAuthSession();

const FEATURES = [
  { icon: 'location', text: 'Find streamers near you' },
  { icon: 'radio', text: 'See who is live right now' },
  { icon: 'chatbubbles', text: 'Match and chat in real time' },
] as const;

export default function SignIn() {
  const { signIn } = useAuthActions();
  const config = useQuery(api.app.config);
  const [busy, setBusy] = useState<'twitch' | 'demo' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (kind: 'twitch' | 'demo', action: () => Promise<void>) => {
    setBusy(kind);
    setError(null);
    try {
      await action();
    } catch {
      setError('Sign-in failed. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const withTwitch = () =>
    run('twitch', async () => {
      // On the web the browser itself is redirected to Twitch and back.
      if (Platform.OS === 'web') {
        await signIn('twitch');
        return;
      }
      const redirectTo = Linking.createURL('/');
      const { redirect } = await signIn('twitch', { redirectTo });
      if (!redirect) return;
      const result = await WebBrowser.openAuthSessionAsync(redirect.toString(), redirectTo);
      if (result.type !== 'success') return;
      const code = new URL(result.url).searchParams.get('code');
      if (code) await signIn('twitch', { code });
    });

  const asDemo = () => run('demo', async () => void (await signIn('anonymous')));

  return (
    <Screen edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Ionicons name="heart" size={44} color="#fff" />
        </View>
        <Text style={styles.title}>StreamMatch</Text>
        <Text style={styles.subtitle}>Meet the people behind the streams.</Text>
        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature.text} style={styles.feature}>
              <Ionicons name={feature.icon} size={20} color={Colors.primary} />
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        {error !== null && <Text style={styles.error}>{error}</Text>}
        {config?.twitchLogin === false && (
          <Text style={styles.notice}>
            Twitch login is not configured on this server yet. See the README.
          </Text>
        )}
        <Button
          label="Continue with Twitch"
          icon="logo-twitch"
          onPress={withTwitch}
          busy={busy === 'twitch'}
          disabled={busy !== null || config?.twitchLogin === false}
        />
        {config?.demoLogin && (
          <Button
            label="Try a demo account"
            variant="secondary"
            onPress={asDemo}
            busy={busy === 'demo'}
            disabled={busy !== null}
          />
        )}
        <Text style={styles.legal}>18+ only. We never post to Twitch or read your email.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, justifyContent: 'space-between' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: { color: Colors.text, fontSize: 36, fontWeight: '800' },
  subtitle: { color: Colors.textMuted, fontSize: 17, textAlign: 'center' },
  features: { marginTop: Spacing.xl, gap: Spacing.md },
  feature: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureText: { color: Colors.text, fontSize: 16 },
  actions: { gap: Spacing.md },
  error: { color: Colors.pass, textAlign: 'center' },
  notice: { color: Colors.textMuted, textAlign: 'center', fontSize: 13 },
  legal: { color: Colors.textMuted, fontSize: 12, textAlign: 'center' },
});
