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
    let isContinuation = false;

    // A section header usually takes up space equivalent to ~2 lines
    const titleSpace = section.title ? 2 : 1; 

    // Eliminado: Salto de columna prematuro.
    // Ahora el algoritmo prioriza llenar la columna hasta el borde antes de saltar.

    while (unpaginatedLines.length > 0) {
      // Current available space on the column, floored to avoid fractional slices infinite loops
      let availableSpace = Math.floor(linesPerColumn - currentLinesCount);
      if (!isContinuation) {
        availableSpace -= titleSpace;
      }

      if (availableSpace <= 0) {
        // Column is full, push and start new column
        allColumns.push(currentColumnSections);
        currentColumnSections = [];
        currentLinesCount = 0;
        availableSpace = linesPerColumn;
      }

      const linesToTake = unpaginatedLines.slice(0, availableSpace);
      unpaginatedLines = unpaginatedLines.slice(availableSpace);

      currentColumnSections.push({
        ...section,
        lines: linesToTake,
        isContinuation
      });

      currentLinesCount += linesToTake.length + (isContinuation ? 0 : titleSpace);
      isContinuation = true;
    }
    
    // Add extra padding spacing after section finishes inside column
    currentLinesCount += 1.5; 
  });

  if (currentColumnSections.length > 0) {
    allColumns.push(currentColumnSections);
  }

  // Ahora empaquetamos las columnas dinámicamente según 'columnsPerPage' en Páginas A4
  // Regla del usuario: Maximo 2 columnas. Si cabe en 1, solo devuelve 1 (ocupará el display 100%).
  // Si no cabe, usa 2. Si las 2 se llenan, salta a otra página.
  const pages: Page[] = [];
  const maxCols = columnsPerPage > 0 ? columnsPerPage : 2; 

  for (let i = 0; i < allColumns.length; i += maxCols) {
    const pageColumns: PageSection[][] = [];
    for (let c = 0; c < maxCols; c++) {
      if (allColumns[i + c]) {
         pageColumns.push(allColumns[i + c]);
      }
    }
    
    pages.push({
      id: `page-${i / maxCols}`,
      index: i / maxCols,
      columns: pageColumns
    });
  }

  return pages;
}
