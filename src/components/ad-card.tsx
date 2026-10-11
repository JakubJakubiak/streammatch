import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';

/**
 * The ad slot shown between profiles for free accounts.
 * It currently promotes Premium; an ad network's native ad view can be
 * rendered here instead without touching the deck logic.
 */
export function AdCard({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <View style={styles.card}>
      <LinearGradient colors={['#3B1D80', '#18181B']} style={StyleSheet.absoluteFill} />
      <Text style={styles.label}>AD</Text>
      <View style={styles.body}>
        <Ionicons name="sparkles" size={64} color={Colors.primary} />
        <Text style={styles.title}>Tired of ads?</Text>
        <Text style={styles.text}>
          Go Premium for unlimited likes and an ad-free deck. Swipe to skip.
        </Text>
      </View>
      <Button label="See Premium" icon="star" onPress={onUpgrade} style={styles.button} />
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
    padding: Spacing.lg,
  },
  label: {
    alignSelf: 'flex-start',
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: Colors.textMuted,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  title: { color: Colors.text, fontSize: 30, fontWeight: '800', textAlign: 'center' },
  text: { color: Colors.textMuted, fontSize: 16, lineHeight: 23, textAlign: 'center' },
  button: { alignSelf: 'stretch' },
});
