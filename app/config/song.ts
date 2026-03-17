import type { Song, Section, Syllable, Word, Line } from "./config.js";

export const song: Song = {
  id: 'song-1',
  title: 'Mi primera canción',
  bpm: 120, // <- Importante para tu reproductor estilo Spotify
  sections: [
    {
      id: 'section-1',
      type: 'verse',
      lines: [
        {
          id: 'line-1',
          words: [
            // PALABRA 1: "Canta"
            {
              id: 'word-1',
              syllables: [
                { id: 'syl-1', text: 'can', chord: null },
                {
                  id: 'syl-2',
                  text: 'ta',
                  chord: { id: 'chord-1', rootNote: 'G', variation: '' }
                }
              ]
            },
            // PALABRA 2: "mi"
            {
              id: 'word-2',
              syllables: [
                { id: 'syl-3', text: 'mi', chord: null }
              ]
            },
            // PALABRA 3: "alma"
            {
              id: 'word-3',
              syllables: [
                {
                  id: 'syl-4',
                  text: 'al',
                  chord: { id: 'chord-2', rootNote: 'C', variation: 'm' }
                },
                { id: 'syl-5', text: 'ma', chord: null }
              ]
            }
          ],
          beats: 0,
          startTime: 0,
          endTime: 0
        }
      ]
    }
  ]
};
