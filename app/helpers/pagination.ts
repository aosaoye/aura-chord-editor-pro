import type { Song, Section, Line } from "../config/config";

export interface PageSection {
  id: string; // section id
  title?: string;
  type: string;
  repeat?: number;
  lines: Line[];
  isContinuation?: boolean;
}

export interface Page {
  id: string;
  index: number;
  columns: PageSection[][];
}

export function paginateSong(song: Song, linesPerColumn: number = 17, columnsPerPage: number = 3): Page[] {
  const allColumns: PageSection[][] = [];
  
  let currentLinesCount = 0;
  let currentColumnSections: PageSection[] = [];

  song.sections.forEach(section => {
    let unpaginatedLines = [...section.lines];
    // Extraemos la altura dinámica para convertir píxeles a su equivalente en "Líneas Puras de Texto"
    // textLineHeight es típicamente unos 30px (16px * 1.2 + gap de 10px). 
    const textLineHeight = (song.layout?.baseFontSize || 16) * 1.2 + Math.max(0.25, ((song.layout?.lineHeight || 1.5) - 1)) * 16;
    
    // Una sección aporta físicamente en el DOM: gap-6/gap-8 (32px) del parent column 
    // Si tiene título, el H2 añade otros ~20px y activa el gap-6 interno de la sección (24px) = 44px
    // Convertimos esos píxeles en el "Costo de Líneas"
    const sectionOverheadPx = 32 + (section.title ? 44 : 0);
    const sectionOverheadCost = sectionOverheadPx / textLineHeight;

    let isContinuation = false;

    // Si es el inicio de una sección, restamos su overhead directamente del availableSpace
    const titleSpace = sectionOverheadCost;

    while (unpaginatedLines.length > 0) {
      let availableSpace = linesPerColumn - currentLinesCount;
      if (!isContinuation) {
        availableSpace -= titleSpace;
      }

      if (availableSpace <= 0) {
        allColumns.push(currentColumnSections);
        currentColumnSections = [];
        currentLinesCount = 0;
        availableSpace = linesPerColumn - (!isContinuation ? titleSpace : 0);
      }

      let costAccumulator = 0;
      let linesToTakeCount = 0;

      for (let i = 0; i < unpaginatedLines.length; i++) {
        const line = unpaginatedLines[i];
        const hasChords = line.words.some(w => w.syllables.some(s => !!s.chord));
        
        // Approximate character length of the entire line
        const charLength = line.words.reduce((sum, w) => sum + w.syllables.reduce((sSum, s) => sSum + s.text.length, 0), 0) + line.words.length;
        
        // Estimación de ancho en píxeles
        const baseFontSize = song.layout?.baseFontSize || 16;
        const charWidth = baseFontSize * 0.55; // Width of a letter on average
        const linePixelWidth = charLength * charWidth;

        // Calculamos el ancho disponible para la columna en A4 horizontal
        const totalA4ContentWidth = 794 - (64 * 2); // 794px menos padding lateral (~128px)
        const gapPx = 32; // gap-8
        const columnWidthPx = (totalA4ContentWidth - (gapPx * (columnsPerPage - 1))) / columnsPerPage;
        
        // Si la línea es más larga que la columna, contaremos múltiples líneas (wrap)
        const wrapCycles = Math.max(1, Math.ceil(linePixelWidth / columnWidthPx));

        // Calculamos el costo dinámico real basado en los estilos CSS exactos
        const chordLineHeight = textLineHeight + ((song.layout?.chordFontSize || 14) * 1.5);
        const chordRatio = chordLineHeight / textLineHeight;
        
        let lineCost = hasChords ? chordRatio : 1;

        if (wrapCycles > 1) {
            // Cada salto de línea (wrap) añade textLineHeight + rowGap ('1.5em')
            const wrapAddedPx = (baseFontSize * 1.2) + (baseFontSize * 1.5);
            const extraWrapCost = wrapAddedPx / textLineHeight;
            lineCost += (wrapCycles - 1) * extraWrapCost; 
        }

        // Add extra line cost if the interlineado is customized (since baseLinesPerColumn is an average estimate)
        if (song.layout?.lineHeight && song.layout.lineHeight > 2.0 && columnsPerPage > 1) {
            // Un pequeño ajuste defensivo si el interlineado es enorme y la columna muy estrecha
            lineCost += 0.2;
        }

        if (costAccumulator + lineCost <= availableSpace || linesToTakeCount === 0) {
           costAccumulator += lineCost;
           linesToTakeCount++;
        } else {
           break;
        }
      }

      const linesToTake = unpaginatedLines.slice(0, linesToTakeCount);
      unpaginatedLines = unpaginatedLines.slice(linesToTakeCount);

      currentColumnSections.push({
        ...section,
        lines: linesToTake,
        isContinuation
      });

      currentLinesCount += costAccumulator + (isContinuation ? 0 : titleSpace);
      isContinuation = true;
    }
    
    // Add extra padding spacing after section finishes inside column
    currentLinesCount += 1.5; 
  });

  if (currentColumnSections.length > 0) {
    allColumns.push(currentColumnSections);
  }

  // Ahora empaquetamos las columnas dinámicamente según 'columnsPerPage' en Páginas A4
  const pages: Page[] = [];

  for (let i = 0; i < allColumns.length; i += columnsPerPage) {
    const pageColumns: PageSection[][] = [];
    for (let c = 0; c < columnsPerPage; c++) {
      if (allColumns[i + c]) {
         pageColumns.push(allColumns[i + c]);
      }
    }
    
    pages.push({
      id: `page-${i / columnsPerPage}`,
      index: Math.floor(i / columnsPerPage),
      columns: pageColumns
    });
  }

  return pages;
}
