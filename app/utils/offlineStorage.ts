// app/utils/offlineStorage.ts
import { get, set, del, keys } from 'idb-keyval';
import type { Song } from '../config/config';

// 🚀 SENIOR FIX: IndexedDB es asíncrono y mucho más capaz que LocalStorage
// para JSONs inmensos como los de tus canciones.

const DB_PREFIX = 'offline_song_';

export const offlineStorage = {
  // 1. Guardar canción para uso offline
  saveSong: async (song: Song) => {
    try {
      if (!song.id) return;
      const offlineData = {
        ...song,
        metadata: {
            ...song.metadata,
            isOfflineCopy: true,
            offlineSavedAt: new Date().toISOString()
        }
      };
      await set(`${DB_PREFIX}${song.id}`, offlineData);
      console.log(`Canción ${song.title} cacheada para offline.`);
    } catch (error) {
      console.error("Failed to cache song offline:", error);
    }
  },

  // 2. Obtener canción cacheada
  getSong: async (songId: string): Promise<Song | null> => {
    try {
      const cached = await get(`${DB_PREFIX}${songId}`);
      return cached as Song || null;
    } catch (error) {
      console.error("Failed to retrieve cached song:", error);
      return null;
    }
  },

  // 3. Obtener lista de canciones offline
  getAllCachedSongs: async (): Promise<Song[]> => {
      const allKeys = await keys();
      const songKeys = allKeys.filter(key => typeof key === 'string' && key.startsWith(DB_PREFIX));
      const songs = await Promise.all(songKeys.map(key => get(key)));
      return (songs.filter(Boolean) as Song[]).sort((a,b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }
};