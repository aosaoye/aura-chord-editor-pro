import type { Chord, Song } from "./config.js";

export function updateSyllableChord(song: Song, id: string, chord: Chord | null): Song {
    const songCopy = structuredClone(song);

    for (let section of songCopy.sections) {
        for (let line of section.lines) {
            for (let word of line.words) {
                for (let syllable of word.syllables) {
                    if (syllable.id === id) {
                        syllable.chord = chord;
                        return songCopy; // Retorno temprano: ¡Éxito!
                    }
                }
            }
        }
    }

    return songCopy; // Red de seguridad: Si no lo encuentra, devuelve la canción intacta
}