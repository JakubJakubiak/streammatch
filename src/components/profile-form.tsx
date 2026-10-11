import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip } from '@/components/ui';
import { INTENTS, MAX_TAGS, TAGS, type Intent } from '@/constants/options';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type ProfileDraft = { bio: string; intent: Intent; tags: string[] };

const MAX_BIO = 300;

/** Bio, intent and interest fields, shared by onboarding and profile editing. */
export function ProfileForm({
  draft,
  onChange,
}: {
  draft: ProfileDraft;
  onChange: (draft: ProfileDraft) => void;
}) {
  const toggleTag = (tag: string) => {
    const selected = draft.tags.includes(tag);
    if (!selected && draft.tags.length >= MAX_TAGS) return;
    onChange({
      ...draft,
      tags: selected ? draft.tags.filter((t) => t !== tag) : [...draft.tags, tag],
    });
  };

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <Text style={styles.label}>About you</Text>
        <TextInput
          value={draft.bio}
          onChangeText={(bio) => onChange({ ...draft, bio })}
          placeholder="What do you stream? What are you looking for?"
          placeholderTextColor={Colors.textMuted}
          maxLength={MAX_BIO}
          multiline
          style={styles.input}
        />
        <Text style={styles.counter}>
          {draft.bio.length}/{MAX_BIO}
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Looking for</Text>
        <View style={styles.chips}>
          {INTENTS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              icon={option.icon}
              selected={draft.intent === option.value}
              onPress={() => onChange({ ...draft, intent: option.value })}
            />
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>
          Interests ({draft.tags.length}/{MAX_TAGS})
        </Text>
        <View style={styles.chips}>
          {TAGS.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              selected={draft.tags.includes(tag)}
              onPress={() => toggleTag(tag)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.lg },
  field: { gap: Spacing.sm },
  label: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  input: {
    minHeight: 96,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  counter: { color: Colors.textMuted, fontSize: 12, alignSelf: 'flex-end' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
