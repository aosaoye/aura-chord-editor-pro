const E_STRING_NOTES = ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#'];
const A_STRING_NOTES = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

const SHAPES = {
  E: {
    "major": [0, 2, 2, 1, 0, 0],
    "m": [0, 2, 2, 0, 0, 0],
    "7": [0, 2, 0, 1, 0, 0],
    "m7": [0, 2, 0, 0, 0, 0],
    "maj7": [0, 2, 1, 1, 0, 0]
  },
  A: {
    "major": [-1, 0, 2, 2, 2, 0],
    "m": [-1, 0, 2, 2, 1, 0],
    "7": [-1, 0, 2, 0, 2, 0],
    "m7": [-1, 0, 2, 0, 1, 0],
    "maj7": [-1, 0, 2, 1, 2, 0]
  }
};

function toSharp(note: string) {
  const map: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
  return map[note] || note;
}

export function getGuitarFingering(rootNote: string, variation: string): { frets: number[], baseFret: number } {
  const openChords: Record<string, Record<string, number[]>> = {
    "C": {
      "major": [-1, 3, 2, 0, 1, 0], "m": [-1, 3, 5, 5, 4, 3], "7": [-1, 3, 2, 3, 1, 0], "maj7": [-1, 3, 2, 0, 0, 0], "m7": [-1, 3, 5, 3, 4, 3]
    },
    "D": {
      "major": [-1, -1, 0, 2, 3, 2], "m": [-1, -1, 0, 2, 3, 1], "7": [-1, -1, 0, 2, 1, 2], "maj7": [-1, -1, 0, 2, 2, 2], "m7": [-1, -1, 0, 2, 1, 1]
    },
    "E": {
      "major": [0, 2, 2, 1, 0, 0], "m": [0, 2, 2, 0, 0, 0], "7": [0, 2, 0, 1, 0, 0], "maj7": [0, 2, 1, 1, 0, 0], "m7": [0, 2, 0, 0, 0, 0]
    },
    "F": {
      "major": [1, 3, 3, 2, 1, 1], "maj7": [-1, -1, 3, 2, 1, 0], "m": [1, 3, 3, 1, 1, 1]
    },
    "G": {
      "major": [3, 2, 0, 0, 0, 3], "7": [3, 2, 0, 0, 0, 1], "maj7": [3, 2, 0, 0, 0, 2], "m": [3, 5, 5, 3, 3, 3]
    },
    "A": {
      "major": [-1, 0, 2, 2, 2, 0], "m": [-1, 0, 2, 2, 1, 0], "7": [-1, 0, 2, 0, 2, 0], "maj7": [-1, 0, 2, 1, 2, 0], "m7": [-1, 0, 2, 0, 1, 0]
    },
    "B": {
      "major": [-1, 2, 4, 4, 4, 2], "m": [-1, 2, 4, 4, 3, 2], "7": [-1, 2, 4, 2, 4, 2]
    }
  };

  let normRoot = toSharp(rootNote);
  let normVar = variation || "major";

  if (normVar === "min" || normVar === "-") normVar = "m";
  if (normVar === "-7" || normVar === "min7") normVar = "m7";
  if (normVar === "M7" || normVar === "major7") normVar = "maj7";

  if (openChords[normRoot] && openChords[normRoot][normVar]) {
    return { frets: openChords[normRoot][normVar], baseFret: 1 };
  }

  const eFret = Math.max(0, E_STRING_NOTES.indexOf(normRoot));
  const aFret = Math.max(0, A_STRING_NOTES.indexOf(normRoot));

  let shape = "E";
  let fretShift = eFret;

  // Let's use the shape closest to the nut, unless it's an open string
  if (aFret !== 0 && (eFret === 0 || aFret < eFret)) {
    shape = "A";
    fretShift = aFret;
  }

  const baseShape = (SHAPES as any)[shape][normVar] || (SHAPES as any)[shape]["major"];

  const mappedFrets = baseShape.map((f: number) => {
    if (f === -1) return -1;
    // For barred shapes, "0" represents the nut. So if we shift by `n`, "0" becomes `n`.
    return f + fretShift;
  });

  const activeFrets = mappedFrets.filter((f: number) => f > 0);
  const maxFret = activeFrets.length ? Math.max(...activeFrets) : 0;
  const minFret = activeFrets.length ? Math.min(...activeFrets) : 1;

  let baseFret = 1;

  // If the chord requires frets past 4, we must shift the view port
  if (maxFret > 4) {
    baseFret = minFret;
  }

  return { frets: mappedFrets, baseFret };
}
