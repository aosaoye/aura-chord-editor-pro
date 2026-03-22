import { Chord } from "../config/config";

const englishNotesFlat = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const englishNotesSharp = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const spanishNotesFlat = ['Do', 'Reb', 'Re', 'Mib', 'Mi', 'Fa', 'Solb', 'Sol', 'Lab', 'La', 'Sib', 'Si'];
const spanishNotesSharp = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

const notesMap: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
  'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

const romanNumerals = ['I', 'bII', 'II', 'bIII', 'III', 'IV', '#IV', 'V', 'bVI', 'VI', 'bVII', 'VII'];

export type NotationType = 'english' | 'spanish' | 'roman';

export function formatChordText(chord: Chord, notation: NotationType, keyHint: string = 'C'): { root: string, variation: string, bass: string } {
  const noteIndex = notesMap[chord.rootNote];
  let bassStr = "";

  if (chord.bassNote) {
    const bassIndex = notesMap[chord.bassNote];
    if (bassIndex !== undefined) {
      if (notation === 'spanish') {
        bassStr = chord.rootNote.includes('b') ? spanishNotesFlat[bassIndex] : spanishNotesSharp[bassIndex];
      } else if (notation === 'roman') {
        const keyIndex = notesMap[keyHint] ?? 0;
        let relativeIdx = (bassIndex - keyIndex) % 12;
        if (relativeIdx < 0) relativeIdx += 12;
        bassStr = romanNumerals[relativeIdx];
      } else {
        bassStr = chord.bassNote;
      }
    } else {
      bassStr = chord.bassNote;
    }
  }

  if (noteIndex === undefined) return { root: chord.rootNote, variation: chord.variation, bass: bassStr };

  const isFlat = chord.rootNote.includes('b');
  let rootStr = chord.rootNote;
  let varStr = chord.variation;

  if (notation === 'spanish') {
    rootStr = isFlat ? spanishNotesFlat[noteIndex] : spanishNotesSharp[noteIndex];
  } else if (notation === 'roman') {
    const keyIndex = notesMap[keyHint] ?? 0;
    let relativeIdx = (noteIndex - keyIndex) % 12;
    if (relativeIdx < 0) relativeIdx += 12;
    
    let roman = romanNumerals[relativeIdx];
    
    // Convert to lowercase if minor
    const isMinor = /^(m|min|-|dim)(?!aj)/i.test(chord.variation);
    if (isMinor) {
      roman = roman.toLowerCase();
      // optionally replace 'm' from variation so it displays ii7 instead of iim7
      varStr = varStr.replace(/^(m|min|-)/i, '');
    }
    rootStr = roman;
  }

  return { root: rootStr, variation: varStr, bass: bassStr };
}
