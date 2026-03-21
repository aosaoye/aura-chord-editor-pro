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
  maxUsedLines: number;
}

export function paginateSong(song: Song, linesPerColumn: number = 17, columnsPerPage: number = 3): Page[] {
  const allColumns: PageSection[][] = [];
  const columnLinesCount: number[] = [];
  
  let currentLinesCount = 0;
  let currentColumnSections: PageSection[] = [];

  song.sections.forEach(section => {
    let unpaginatedLines = [...section.lines];
    let isContinuation = false;

    while (unpaginatedLines.length > 0) {
      const UI_SHOWS_CHORD_SPACER = song.layout?.showChords !== false;
      const baseFontSize = song.layout?.baseFontSize || 16;
      const chordFontSize = song.layout?.chordFontSize || 14;
      const lineHeightFactor = song.layout?.lineHeight || 2.0;

      const chordBoxHeight = UI_SHOWS_CHORD_SPACER ? (chordFontSize * 1.5 + 2) : 0; // +2px for mb-0.5
      const textBoxHeight = baseFontSize * lineHeightFactor;
      const lineGap = 16; // sm:gap-4 CSS exact value 
      
      const singleLinePhysicalPx = chordBoxHeight + textBoxHeight;
      const rowGap = baseFontSize * 1.5; // rowGap: '1.5em'
      const wrappedLineAddedPx = singleLinePhysicalPx + rowGap; 

      // Section header label (text-[10px] + padding) + mt-1 (4px)
      const titlePhysicalPx = !isContinuation ? 19 : 0; 
      // Available content box (899px) minus Top Header (~108px) = ~790px.
      // Determine dynamic max pixels based on layout settings instead of hardcoding 830
      // Page heights match the frontend PDF rendering dimensions
      const isLetter = song.layout?.pageSize === 'CARTA';
      const isLand = song.layout?.orientation === 'landscape';
      const rawPageHeight = isLand ? (isLetter ? 816 : 794) : (isLetter ? 1056 : 1123);
      
      const marginOffsets = { estrecho: 160, normal: 240, amplio: 300 }; // Slight adjustment to prevent PDF bottom-clipping
      const offset = marginOffsets[(song.layout?.margin as keyof typeof marginOffsets) || 'normal'];
      
      // Calculate max pixels based on page height minus margins, minus a 20px safety buffer
      const MAX_PIXELS_PER_COLUMN = rawPageHeight - offset - 20; 
      let availablePixels = MAX_PIXELS_PER_COLUMN - currentLinesCount - titlePhysicalPx;
      
      if (availablePixels <= (singleLinePhysicalPx + lineGap) && currentColumnSections.length > 0) {
        allColumns.push(currentColumnSections);
        columnLinesCount.push(currentLinesCount);
        currentColumnSections = [];
        currentLinesCount = 0;
        availablePixels = MAX_PIXELS_PER_COLUMN - titlePhysicalPx;
      }

      let usedPixelsAccumulator = 0;
      let linesToTakeCount = 0;

      for (let i = 0; i < unpaginatedLines.length; i++) {
        const line = unpaginatedLines[i];
        const charWidthRatio = 0.6; 
        
        let linePixelWidth = 0;
        line.words.forEach((word) => {
           let wordWidth = 0;
           word.syllables.forEach((s) => {
              const textW = s.text.length * baseFontSize * charWidthRatio;
              let chordLen = 0;
              if (s.chord) {
                  const c = s.chord as any;
                  chordLen = (c.rootNote?.length || 1) + (c.variation?.length || 0) + (c.bassNote ? 1 + c.bassNote.length : 0);
              }
              const chordW = chordLen * chordFontSize * charWidthRatio;
              wordWidth += Math.max(textW, chordW);
           });
           linePixelWidth += wordWidth;
        });

        linePixelWidth += Math.max(0, line.words.length - 1) * 16;

        const totalA4ContentWidth = 794 - (64 * 2); 
        const gapPx = 32; 
        const columnWidthPx = (totalA4ContentWidth - (gapPx * (columnsPerPage - 1))) / columnsPerPage;
        
        const wrapCycles = Math.max(1, Math.ceil(linePixelWidth / columnWidthPx));

        // Cada línea "ocupa" su altura más el gap-4 (16px) que la separa de la siguiente
        let currentLinePixels = singleLinePhysicalPx + lineGap;
        if (wrapCycles > 1) {
            // Un wrap añade otra caja entera de línea más rowGap
            currentLinePixels += (wrapCycles - 1) * wrappedLineAddedPx; 
        }

        // Add line forcefully if it's the very first line of a brand new column
        if (usedPixelsAccumulator + currentLinePixels <= availablePixels || linesToTakeCount === 0) {
           usedPixelsAccumulator += currentLinePixels;
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

      currentLinesCount += usedPixelsAccumulator + titlePhysicalPx;
      isContinuation = true;
    }
    
    // Al cerrar la sección, sumamos el gap entre secciones (sm:gap-8 en DOM = 32px)
    currentLinesCount += 32; 
  });

  if (currentColumnSections.length > 0) {
    allColumns.push(currentColumnSections);
    columnLinesCount.push(currentLinesCount);
  }

  // Ahora empaquetamos las columnas dinámicamente según 'columnsPerPage' en Páginas A4
  const pages: Page[] = [];

  for (let i = 0; i < allColumns.length; i += columnsPerPage) {
    const pageColumns: PageSection[][] = [];
    let maxUsedLines = 0;
    for (let c = 0; c < columnsPerPage; c++) {
      if (allColumns[i + c]) {
         pageColumns.push(allColumns[i + c]);
         maxUsedLines = Math.max(maxUsedLines, columnLinesCount[i + c]);
      }
    }
    
    pages.push({
      id: `page-${i / columnsPerPage}`,
      index: Math.floor(i / columnsPerPage),
      columns: pageColumns,
      maxUsedLines
    });
  }

  return pages;
}
