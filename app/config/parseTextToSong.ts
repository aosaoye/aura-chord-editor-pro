import type { Song, Section, Line, Word, Syllable } from "./config";

// --- FUNCIÓN REGALO (No la modifiques) ---
// En producción usaríamos 'silabajs', pero esta Regex rudimentaria sirve para el PMV
function mockSilabear(word: string): string[] {
  if (!word) return [];
  const silabas = word.match(/[^aeiouáéíóúü]*[aeiouáéíóúü]+(?:[^aeiouáéíóúü]*$|[^aeiouáéíóúü](?=[^aeiouáéíóúü]))?/gi);
  return silabas || [word]; // Si falla, devuelve la palabra entera como una sola sílaba
}
// -----------------------------------------

/**
 * Genera un ID corto seguro y aleatorio para evitar colisiones en keys de React
 */
const generateId = (prefix: string) => 
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

export function parseTextToSong(rawText: string, title: string, bpm: number, timeSignature: string = "4/4"): Song {
  // 1. Sanitización exhaustiva y división por bloques (Secciones)
  // Utilizamos replace para limpiar múltiples saltos de línea redundantes
  const cleanText = rawText.trim().replace(/\n{3,}/g, '\n\n');
  const blocks = cleanText.split('\n\n').filter(Boolean);

  // --- ⏱️ MOTOR DE CÁLCULO DE TIEMPO (NUEVO) ---
  // Calculamos matemáticamente las duraciones en base a la velocidad de la canción
  const beatDurationSecs = 60 / bpm; // Ej: si bpm=120, entonces 60/120 = 0.5s por cada golpe de metrónomo (beat)
  
  // Analizamos el compás introducido
  const [beatsPerMeasureStr] = (timeSignature || "4/4").split('/');
  const beatsPerMeasure = parseInt(beatsPerMeasureStr) || 4;
  
  // Asumimos que cada línea lírica dura normalmente 2 compases o 1 compás. Lo configuraremos dinámicamente según el compás.
  const defaultLineBeats = beatsPerMeasure * 2; // Si 4/4, entonces 8 golpes. Si 3/4, 6 golpes.
  const lineDurationSecs = defaultLineBeats * beatDurationSecs; 
  
  // Variable acumuladora mutada que mantendrá el estado del "reloj global" durante todo el mapeo
  let currentGlobalTime = 0; 
  // --------------------------------------------

  const sections: Section[] = blocks.map((block) => {
    // 2. Separamos el bloque en líneas limpias
    const linesText = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
    
    // 3. Inferencia de tipo de Sección
    let sectionType: string = 'Estrofa'; // Default fallback
    let sectionTitle: string | undefined;
    const firstLine = linesText[0];
    const isTagLine = firstLine.startsWith('[') && firstLine.endsWith(']');
    
    // Check if the line is just a numbered title, e.g., "1.", "1. Tu fidelidad", or "I.", "II."
    const isNumberedTitle = /^(?:[IVX]+\.|\d+\.)/i.test(firstLine);
    
    if (isTagLine) {
      const tag = firstLine.toLowerCase();
      if (tag.includes('coro') || tag.includes('chorus')) sectionType = 'Coro';
      else if (tag.includes('puente') || tag.includes('bridge')) sectionType = 'Puente';
      else if (tag.includes('pre') || tag.includes('pre-coro') || tag.includes('pre-chorus')) sectionType = 'Pre-Coro';
      else if (tag.includes('intro') || tag.includes('preludio') || tag.includes('prelude')) sectionType = 'Intro';
      else if (tag.includes('outro') || tag.includes('final') || tag.includes('coda')) sectionType = 'Final';
      else if (tag.includes('instrumental') || tag.includes('solo')) sectionType = 'Instrumental';
      else sectionType = firstLine.replace('[', '').replace(']', '').trim();
      
      // Mutamos el array extrayendo la primera línea para que no conste como letra cantada
      linesText.shift();
    } else if (isNumberedTitle) {
      // It's a title!
      sectionTitle = firstLine;
      linesText.shift();
    }

    // 4. Mapeo estructurado (Lines -> Words -> Syllables)
    const lines: Line[] = linesText.map((lineStr) => {
      // 5. División eficiente por espacios (preservando los cortes de palabra)
      const wordsText = lineStr.split(/\s+/).filter(Boolean);

      const words: Word[] = wordsText.map((wordStr) => {
        // 6. Análisis silábico mediante la función auxiliar
        const syllablesText = mockSilabear(wordStr);

        const syllables: Syllable[] = syllablesText.map((sylStr) => ({
          id: generateId('syl'),
          text: sylStr,
          chord: null // Estado inicial: sin acordes
        }));

        return {
          id: generateId('word'),
          syllables
        };
      });

      // --- ASIGNACIÓN DEL TIEMPO A LA LÍNEA ---
      // Capturamos la foto de en qué segundo arranca esta línea específica
      const startTime = currentGlobalTime;
      // Le sumamos a ese arranque lo que hemos calculado matemáticamente que debe durar
      const endTime = startTime + lineDurationSecs;
      
      // Adelantamos las agujas de nuestro 'reloj global' para que la siguiente 
      // línea que lea el bucle map() sepa dónde empezar sin pisarse con esta.
      currentGlobalTime = endTime; 
      // -----------------------------------------

      return {
        id: generateId('line'),
        words,
        beats: defaultLineBeats,
        startTime,
        endTime,
        repeat: 1
      };
    });

    // --- BYPASS DE COMPRESIÓN DE LÍNEAS REPETIDAS ---
    // A petición del usuario: "si en una estrofa o coro se repite una linea que no lo resuma".
    // Las líneas repetidas ahora se mantendrán intactas en el lienzo.
    const deduplicatedLines: Line[] = lines;

    return {
      id: generateId('sec'),
      title: sectionTitle,
      type: sectionType,
      lines: deduplicatedLines,
      repeat: 1
    };
  });

  // --- COMPRESIÓN DE SECCIONES REPETIDAS ---
  // Si un bloque entero es idéntico al bloque anterior, aumentamos su contador
  const getSectionFootprint = (section: Section) => 
    section.lines.map(l => `${l.words.map(w => w.syllables.map(s => s.text).join('')).join(' ').toLowerCase()}|x${l.repeat || 1}`).join('\n');
  
  const deduplicatedSections: Section[] = [];
  sections.forEach((currentSection) => {
    if (deduplicatedSections.length === 0) {
      deduplicatedSections.push(currentSection);
      return;
    }
    const lastSection = deduplicatedSections[deduplicatedSections.length - 1];
    
    // Simplificamos la condición a sólo footprint idéntico
    if (getSectionFootprint(currentSection) === getSectionFootprint(lastSection)) {
      lastSection.repeat = (lastSection.repeat || 1) + 1;
    } else {
      deduplicatedSections.push(currentSection);
    }
  });

  return {
    id: generateId('song'),
    title,
    bpm,
    timeSignature,
    sections: deduplicatedSections
  };
}