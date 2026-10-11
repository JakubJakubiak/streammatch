import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Screen({
  children,
  edges = ['top'],
  style,
}: {
  children: ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView edges={edges} style={styles.screen}>
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
}

export function Loading() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  children,
}: {
  icon: IconName;
  title: string;
  message: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.centered}>
      <Ionicons name={icon} size={48} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  busy = false,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const color = variant === 'danger' ? Colors.pass : Colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? styles.buttonPrimary : styles.buttonSecondary,
        pressed && (variant === 'primary' ? styles.buttonPrimaryPressed : styles.pressed),
        (disabled || busy) && styles.disabled,
        style,
      ]}>
      {busy ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={color} />}
          <Text style={[styles.buttonLabel, { color }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  selected = false,
  onPress,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected } : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}>
      {icon && <Ionicons name={icon} size={14} color={Colors.text} />}
      <Text style={styles.chipLabel}>{label}</Text>
    </Pressable>
  );
}

export function Avatar({ uri, size }: { uri: string | null; size: number }) {
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (uri === null) {
    return (
      <View style={[styles.avatarFallback, shape]}>
        <Ionicons name="person" size={size / 2} color={Colors.textMuted} />
      </View>
    );
  }
  return <Image source={uri} style={[styles.avatar, shape]} contentFit="cover" transition={150} />;
}

export function LiveBadge({ viewers }: { viewers?: number | null }) {
  return (
    <View style={styles.live}>
      <Text style={styles.liveLabel}>LIVE{viewers != null ? ` · ${viewers}` : ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
    backgroundColor: Colors.background,
  },
  emptyTitle: { color: Colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptyMessage: {
    color: Colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  button: {
    minHeight: 50,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  buttonPrimary: { backgroundColor: Colors.primary },
  buttonPrimaryPressed: { backgroundColor: Colors.primaryPressed },
  buttonSecondary: { backgroundColor: Colors.surfaceRaised },
  buttonLabel: { fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipLabel: { color: Colors.text, fontSize: 13, fontWeight: '500' },
  avatar: { backgroundColor: Colors.surfaceRaised },
  avatarFallback: {
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  live: {
    backgroundColor: Colors.live,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  liveLabel: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
});
