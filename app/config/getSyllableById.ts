import type { Song, Syllable } from "./config";

export function getSyllableById(song: Song, targetId: string): Syllable | null {
    for (const section of song.sections) {
        for (const line of section.lines) {
            for (const word of line.words) {
                for (const syllable of word.syllables) {
                    if (syllable.id === targetId) {
                        return syllable; 
                    }
                }
            }
        }
    }
    return null; 
}