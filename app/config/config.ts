export interface Chord {
    id: string,
    rootNote: string,
    variation: string,
    bassNote?: string
}

export interface Syllable {
    id: string,
    text: string,
    chord: Chord | null
}

export interface Word {
    id: string,
    syllables: Syllable[]
}

export interface Line {
    id: string,
    words: Word[],
    beats: number,       // Cuántos beats dura la línea (ej: 8)
    startTime: number,   // Momento exacto en el que empieza (en segundos)
    endTime: number,     // Momento exacto en el que termina (en segundos)
    repeat?: number      // Numero de repeticiones (ej. x2, x4)
}

export interface Section {
    id: string,
    title?: string,      // Título opcional, e.g. "1." o "2. Tu fidelidad"
    type: string | 'Estrofa' | 'Coro' | 'Puente' | 'Pre-Coro' | 'Intro' | 'Final' | 'Instrumental',
    lines: Line[],
    repeat?: number      // Numero de repeticiones (ej. x2, x4)
}

export interface LayoutSettings {
  columns: 1 | 2 | 3 | 4;
  baseFontSize: number;
  chordFontSize: number;
  lineHeight: number;
  fontFamily: 'sans' | 'serif' | 'mono';
}

export interface Song {
    id: string,
    userId?: string,
    authorName?: string,
    title: string,
    bpm: number,
    timeSignature?: string, // e.g. "4/4", "3/4"
    sections: Section[],
    layout?: LayoutSettings, // Configuraciones visuales propias de la canción
    metadata?: {
        originalCreatorId?: string,
        authorName?: string,
        offlineSavedAt?: string,
        isOfflineCopy?: boolean
    }
}