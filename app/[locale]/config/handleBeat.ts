
// Funcion que calcula la duracion de un beat en segundos
export function getBeatDuration(bpm: number): number {
    return 60000 / bpm;
}

// Funcion que calcula la duración de una linea
export function calculateLineDuration(bpm: number, beats: number): number {
    const beatDurationMs = getBeatDuration(bpm);
    const totalDurationMs = beatDurationMs * beats
    return totalDurationMs / 1000;
}
