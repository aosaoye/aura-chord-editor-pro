import { Song } from "../config/config";

const standardScale = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

const notesMap: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
  'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

export function transposeRoot(root: string, semitones: number): string {
  const index = notesMap[root];
  if (index === undefined) return root;

  let newIdx = (index + semitones) % 12;
  if (newIdx < 0) newIdx += 12;
  return standardScale[newIdx];
}

export function transposeSong(song: Song, semitones: number): Song {
  return {
    ...song,
    sections: song.sections.map((section) => ({
      ...section,
      lines: section.lines.map((line) => ({
        ...line,
        words: line.words.map((word) => ({
          ...word,
          syllables: word.syllables.map((syl) => {
            if (!syl.chord) return syl;
            return {
              ...syl,
              chord: {
                ...syl.chord,
                rootNote: transposeRoot(syl.chord.rootNote, semitones),
                ...(syl.chord.bassNote ? { bassNote: transposeRoot(syl.chord.bassNote, semitones) } : {})
              }
            };
          })
        }))
      }))
    }))
  };
}
