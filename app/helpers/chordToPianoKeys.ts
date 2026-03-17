export function getChordKeys(rootNote: string, variation: string, bassNote?: string, baseOctave: number = 4): number[] {
  const noteToIndex: Record<string, number> = {
    "C": 0, "C#": 1, "Db": 1,
    "D": 2, "D#": 3, "Eb": 3,
    "E": 4,
    "F": 5, "F#": 6, "Gb": 6,
    "G": 7, "G#": 8, "Ab": 8,
    "A": 9, "A#": 10, "Bb": 10,
    "B": 11
  };

  let rootIndex = noteToIndex[rootNote];
  if (rootIndex === undefined) return [];

  // Intervals mapping based on variation
  let intervals = [0, 4, 7]; // Default Major triad

  const v = variation.toLowerCase();
  
  if (v === "m" || v === "min" || v === "-") {
    intervals = [0, 3, 7]; // Minor triad
  } else if (v === "dim" || v === "°") {
    intervals = [0, 3, 6]; // Diminished triad
  } else if (v === "aug" || v === "+" || v === "#5") {
    intervals = [0, 4, 8]; // Augmented triad
  } else if (v === "sus4") {
    intervals = [0, 5, 7]; // Suspended 4th
  } else if (v === "sus2") {
    intervals = [0, 2, 7]; // Suspended 2nd
  } else if (v === "7") {
    intervals = [0, 4, 7, 10]; // Dominant 7th
  } else if (v === "maj7" || v === "major7" || variation === "M7") {
    intervals = [0, 4, 7, 11]; // Major 7th
  } else if (v === "m7" || v === "-7" || v === "min7") {
    intervals = [0, 3, 7, 10]; // Minor 7th
  } else if (v === "m7b5" || v === "ø") {
    intervals = [0, 3, 6, 10]; // Half-diminished
  } else if (v === "dim7" || v === "°7") {
    intervals = [0, 3, 6, 9]; // Diminished 7th
  } else if (v === "add9") {
    intervals = [0, 4, 7, 14]; // Add 9
  } else if (v === "m9") {
    intervals = [0, 3, 7, 10, 14]; // Minor 9
  } else if (v === "maj9") {
    intervals = [0, 4, 7, 11, 14]; // Major 9
  } else if (v === "9") {
    intervals = [0, 4, 7, 10, 14]; // Dominant 9
  } else if (v === "11") {
    intervals = [0, 4, 7, 10, 14, 17]; // Dominant 11
  } else if (v === "13") {
    intervals = [0, 4, 7, 10, 14, 17, 21]; // Dominant 13
  }

  // Base calculation
  const keys = intervals.map(interval => rootIndex + interval);

  // If there's a bass note, add it an octave lower
  if (bassNote && noteToIndex[bassNote] !== undefined) {
    let bassIndex = noteToIndex[bassNote];
    // Put bass note in the octave below (subtract 12)
    keys.unshift(bassIndex - 12);
  } else {
    // Duplicate the root note an octave lower anyway for a fuller 3D feeling
    keys.unshift(rootIndex - 12);
  }

  // Offset by the baseOctave (C4 = 48 theoretically, but let's just make base 0 = C3 to keep array simple)
  // Let's assume Middle C (C4) is index 24 for a 3-octave view, C3 is 12, C2 is 0.
  // I will make C3 the base 0 index for our 3D Piano.
  // baseOctave 4 means C4 is index 12.
  const absOffset = (baseOctave - 3) * 12;

  // Filter out duplicates and sort
  const uniqueKeys = Array.from(new Set(keys.map(k => k + absOffset))).sort((a,b)=>a-b);
  return uniqueKeys;
}
