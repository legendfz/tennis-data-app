import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@tennishq_favorites';

export async function getFavorites(): Promise<number[]> {
  try {
    const json = await AsyncStorage.getItem(FAVORITES_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function addFavorite(playerId: number): Promise<number[]> {
  const favs = await getFavorites();
  if (!favs.includes(playerId)) {
    favs.push(playerId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  }
  return favs;
}

export async function removeFavorite(playerId: number): Promise<number[]> {
  let favs = await getFavorites();
  favs = favs.filter((id) => id !== playerId);
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  return favs;
}

export async function isFavorite(playerId: number): Promise<boolean> {
  const favs = await getFavorites();
  return favs.includes(playerId);
}

export async function toggleFavorite(playerId: number): Promise<boolean> {
  const favs = await getFavorites();
  if (favs.includes(playerId)) {
    await removeFavorite(playerId);
    return false;
  } else {
    await addFavorite(playerId);
    return true;
  }
}
