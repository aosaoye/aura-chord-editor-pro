import type { Song } from "./config";
import { updateSyllableChord } from "./updateSyllableChord";
import { getSyllableById } from "./getSyllableById";

export function moveChord(song: Song, sourceId: string, destId: string) {
    
    // PASO 1: Usa la función helper para buscar la sílaba de origen (sourceId)
    const sourceSyllable = getSyllableById(song, sourceId);

    // PASO 2: Si por algún error no existe la sílaba, abortamos la misión y devolvemos la canción intacta.
    if (!sourceSyllable || !sourceSyllable.chord) {
        return song;
    }

    // PASO 3: Guardamos el acorde que vamos a mover en una variable.
    const chordToMove = sourceSyllable.chord;

    // PASO 4: Quitamos el acorde de la sílaba original (poniéndolo a null).
    // OJO: updateSyllableChord devuelve una COPIA de la canción. Guárdala en una variable.
    const songWithoutOldChord = updateSyllableChord(song, sourceId, null);

    // PASO 5: Ponemos el acorde que guardamos (chordToMove) en el destino (destId).
    // IMPORTANTE: Debes usar la canción del PASO 4 (songWithoutOldChord), NO la original.
    const finalSong = updateSyllableChord(songWithoutOldChord, destId, chordToMove);

    // PASO 6: Devolvemos la canción final lista para que React la pinte.
    return finalSong;
}