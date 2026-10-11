export const INTENTS = [
  { value: 'friends', label: 'Friends', icon: 'people' },
  { value: 'collab', label: 'Stream collabs', icon: 'videocam' },
  { value: 'dating', label: 'Dating', icon: 'heart' },
] as const;

export type Intent = (typeof INTENTS)[number]['value'];

export const intentLabel = (intent: Intent) =>
  INTENTS.find((option) => option.value === intent)!.label;

export const TAGS = [
  'cozy', 'fps', 'indie', 'speedrun', 'art', 'music', 'anime', 'retro',
  'horror', 'rpg', 'irl', 'esports', 'cats', 'coding', 'vtuber',
] as const;

export const MAX_TAGS = 8;

/** Search radius choices in km. null means no limit. */
export const DISTANCES = [25, 50, 100, 300, null] as const;

export const distanceLabel = (km: number | null) =>
  km === null ? 'Anywhere' : `${km} km`;
