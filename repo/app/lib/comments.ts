import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'comments_v1';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export const PRESET_TAGS = [
  'On Fire',
  'GOAT',
  'Clutch',
  'Struggling',
  'Finished',
  'Old but Gold',
  'Clutch Server',
  'Diamond Hands',
] as const;

export const PRESET_TAG_EMOJIS: Record<string, string> = {
  'On Fire': '🔥',
  'GOAT': '🐐',
  'Clutch': '💪',
  'Struggling': '😤',
  'Finished': '💀',
  'Old but Gold': '👴',
  'Clutch Server': '🎯',
  'Diamond Hands': '💎',
};

export interface PlayerComments {
  playerId: number;
  tags: Record<string, number>;
  customTags: string[];
  lastVoteTimestamp: number;
}

interface CommentsStore {
  [playerId: string]: PlayerComments;
}

// Default mock data for top players
const DEFAULT_DATA: CommentsStore = {
  '1': { playerId: 1, tags: { 'On Fire': 1247, 'Clutch': 892, 'GOAT': 340 }, customTags: [], lastVoteTimestamp: 0 },
  '2': { playerId: 2, tags: { 'GOAT': 3201, 'Old but Gold': 1580, 'Clutch': 920, 'Diamond Hands': 670 }, customTags: [], lastVoteTimestamp: 0 },
  '3': { playerId: 3, tags: { 'On Fire': 2100, 'Clutch': 1340, 'GOAT': 560 }, customTags: [], lastVoteTimestamp: 0 },
  '4': { playerId: 4, tags: { 'Struggling': 430, 'Clutch Server': 380, 'On Fire': 290 }, customTags: [], lastVoteTimestamp: 0 },
  '5': { playerId: 5, tags: { 'Struggling': 820, 'Clutch': 310, 'Diamond Hands': 240 }, customTags: [], lastVoteTimestamp: 0 },
  '6': { playerId: 6, tags: { 'On Fire': 350, 'Struggling': 280 }, customTags: [], lastVoteTimestamp: 0 },
  '7': { playerId: 7, tags: { 'Clutch Server': 290, 'On Fire': 200 }, customTags: [], lastVoteTimestamp: 0 },
};

async function getStore(): Promise<CommentsStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Initialize with defaults
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
  return { ...DEFAULT_DATA };
}

async function saveStore(store: CommentsStore): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export async function getPlayerComments(playerId: number): Promise<PlayerComments> {
  const store = await getStore();
  return store[String(playerId)] || {
    playerId,
    tags: {},
    customTags: [],
    lastVoteTimestamp: 0,
  };
}

export async function canVote(playerId: number): Promise<boolean> {
  const comments = await getPlayerComments(playerId);
  if (comments.lastVoteTimestamp === 0) return true;
  return Date.now() - comments.lastVoteTimestamp >= COOLDOWN_MS;
}

export async function voteTag(playerId: number, tag: string): Promise<boolean> {
  const allowed = await canVote(playerId);
  if (!allowed) return false;

  const store = await getStore();
  const key = String(playerId);
  if (!store[key]) {
    store[key] = { playerId, tags: {}, customTags: [], lastVoteTimestamp: 0 };
  }
  store[key].tags[tag] = (store[key].tags[tag] || 0) + 1;
  store[key].lastVoteTimestamp = Date.now();
  await saveStore(store);
  return true;
}

export async function addCustomTag(playerId: number, tag: string): Promise<void> {
  const store = await getStore();
  const key = String(playerId);
  if (!store[key]) {
    store[key] = { playerId, tags: {}, customTags: [], lastVoteTimestamp: 0 };
  }
  if (!store[key].customTags.includes(tag)) {
    store[key].customTags.push(tag);
  }
  store[key].tags[tag] = (store[key].tags[tag] || 0) + 1;
  store[key].lastVoteTimestamp = Date.now();
  await saveStore(store);
}

export async function getHotTag(playerId: number): Promise<{ tag: string; emoji: string; count: number } | null> {
  const comments = await getPlayerComments(playerId);
  const entries = Object.entries(comments.tags);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  const [tag, count] = entries[0];
  const emoji = PRESET_TAG_EMOJIS[tag] || '🏷️';
  return { tag, emoji, count };
}

export async function getAllHotTags(): Promise<Record<number, { tag: string; emoji: string; count: number }>> {
  const store = await getStore();
  const result: Record<number, { tag: string; emoji: string; count: number }> = {};
  for (const [key, comments] of Object.entries(store)) {
    const entries = Object.entries(comments.tags);
    if (entries.length === 0) continue;
    entries.sort((a, b) => b[1] - a[1]);
    const [tag, count] = entries[0];
    const emoji = PRESET_TAG_EMOJIS[tag] || '🏷️';
    result[parseInt(key)] = { tag, emoji, count };
  }
  return result;
}

export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
