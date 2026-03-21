"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import { useGlobalSettings } from "../context/SettingsContext";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import GlobalAnimatedBackground from "../components/GlobalAnimatedBackground";

interface Suggestion {
  id: number;
  title: string;
  artist: { name: string };
  plainLyrics?: string;
}

export default function LyricsSearchPage() {
  const { settings, isHydrated } = useGlobalSettings();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [artist, setArtist] = useState("");
  const [song, setSong] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canvasRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSuggesting(false);
      return;
    }

    setShowSuggestions(true);
    setIsSuggesting(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        let finalSuggestions: Suggestion[] = [];
        
        // 1. Motor Avanzado: LRCLib (Más robusto, estilo Spotify)
        try {
          const lrclibRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(val)}`);
          if (lrclibRes.ok) {
            const lrclibData = await lrclibRes.json();
            if (Array.isArray(lrclibData) && lrclibData.length > 0) {
              finalSuggestions = lrclibData.map((t: any) => ({
                id: t.id,
                title: t.trackName,
                artist: { name: t.artistName },
                plainLyrics: t.plainLyrics,
              }));
            }
          }
        } catch (e) {
          console.warn("LRCLib unreachable, using fallback.");
        }

        // 2. Motor Secundario: OVH API (Fallback si LRCLib falla o encuentra poco)
        if (finalSuggestions.length < 3) {
          try {
            const ovhRes = await fetch(`https://api.lyrics.ovh/suggest/${encodeURIComponent(val)}`);
            if (ovhRes.ok) {
              const ovhData = await ovhRes.json();
              if (ovhData && ovhData.data) {
                const ovhMapped = ovhData.data.map((t: any) => ({
                   id: t.id,
                   title: t.title,
                   artist: { name: t.artist.name }
                }));
                finalSuggestions = [...finalSuggestions, ...ovhMapped];
              }
            }
          } catch (e) {}
        }

        // Filtrar duplicados por nombre+artista
        const unique = finalSuggestions.filter((v: Suggestion, i: number, a: Suggestion[]) => 
          a.findIndex((t) => (t.title.toLowerCase() === v.title.toLowerCase() && t.artist.name.toLowerCase() === v.artist.name.toLowerCase())) === i
        );
        
        setSuggestions(unique.slice(0, 6)); // Top 6 hits
      } catch (e) {
        console.error("Error fetching suggestions globals");
      } finally {
        setIsSuggesting(false);
      }
    }, 400); // 400ms debounce
  };

  const fetchLyrics = async (artistName: string, songName: string) => {
    setIsLoading(true);
    setErrorMsg("");
    setLyrics("");

    try {
      // Intento 1: LRCLib Directo
      const lrclibUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artistName.trim())}&track_name=${encodeURIComponent(songName.trim())}`;
      try {
        const lrcRes = await fetch(lrclibUrl);
        if (lrcRes.ok) {
           const lrcData = await lrcRes.json();
           if (lrcData && lrcData.plainLyrics) {
              setLyrics(lrcData.plainLyrics);
              setIsLoading(false);
              return;
           }
        }
      } catch (e) {}

      // Intento 2: Búsqueda exhaustiva LRCLib
      try {
         const lrcSearch = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(artistName + ' ' + songName)}`);
         if (lrcSearch.ok) {
            const arr = await lrcSearch.json();
            if (Array.isArray(arr) && arr.length > 0 && arr[0].plainLyrics) {
               setLyrics(arr[0].plainLyrics);
               setIsLoading(false);
               return;
            }
         }
      } catch (e) {}

      // Intento 3: OVH Fallback
      const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artistName.trim())}/${encodeURIComponent(songName.trim())}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.lyrics) {
        setLyrics(data.lyrics);
      } else {
        setErrorMsg(`"${songName}" de ${artistName} no se encuentra en las redes líricas globales.`);
      }
    } catch (err) {
      console.error("Error al conectar con la API:", err);
      setErrorMsg("Error al conectar con la red externa.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = async (s: Suggestion) => {
    setArtist(s.artist.name);
    setSong(s.title);
    setQuery(`${s.title} - ${s.artist.name}`);
    setShowSuggestions(false);
    
    // Si LRCLib ya trajo la letra plana pre-cargada como Knowledge Graph
    if (s.plainLyrics) {
      setLyrics(s.plainLyrics);
    } else {
      await fetchLyrics(s.artist.name, s.title);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0 && showSuggestions) {
      handleSelectSuggestion(suggestions[0]);
    }
  };

  const handleCopy = useCallback(async () => {
    if (!lyrics) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(lyrics);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = lyrics;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showToast("¡Letra copiada al portapapeles!");
    } catch (err) {
      console.error(err);
      showToast("No se pudo copiar al portapapeles.");
    }
  }, [lyrics]);

  const handleSendToEditor = useCallback(async () => {
    if (!lyrics) return;

    // Check if there is an existing unsaved draft in the editor
    const storedSong = localStorage.getItem("chordpro-draft-song");
    if (storedSong) {
      try {
         const parsedStored = JSON.parse(storedSong);
         if (parsedStored && parsedStored.title) {
            // Silently persist the old draft to the database
            await fetch("/api/songs", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ song: parsedStored })
            });
         }
      } catch (e) {
         console.error("No se pudo guardar el borrador automáticamente", e);
      }
      // Remove it so the new search lyrics can take its place freshly
      localStorage.removeItem("chordpro-draft-song");
    }

    localStorage.setItem("chordpro-draft-lyrics", lyrics);
    
    // Capitalize first letters of song and artist for a better title
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    localStorage.setItem("chordpro-draft-title", `${cap(song)} - ${cap(artist)}`);
    
    router.push("/editor");
  }, [lyrics, song, artist, router]);

  const handleExportPNG = useCallback(async () => {
    if (!lyrics) return;
    try {
      showToast("Generando imágenes en formato A4...");
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Dimensiones A4 perfectas (96 DPI)
      const a4Width = 794;
      const a4Height = 1123;
      const margin = 60;
      
      const themeColors: Record<string, string> = {
        "theme-amber": "#d97706", "theme-forest": "#047857", "theme-blue": "#2563EB", 
        "theme-red": "#DC2626", "theme-orange": "#EA580C", "theme-cyan": "#0891B2", 
        "theme-purple": "#9333EA", "theme-lime": "#65A30D", "theme-teal": "#0D9488", 
        "theme-indigo": "#4F46E5", "theme-violet": "#7C3AED", "theme-fuchsia": "#C026D3", 
        "theme-rose": "#E11D48", "theme-slate": "#475569", "theme-gray": "#4B5563", "theme-zinc": "#52525B"
      };
      const pColorHex = themeColors[settings.colorTheme as keyof typeof themeColors] || "#d97706";
      
      const isLight = !document.documentElement.classList.contains('dark');
      const textColorMain = isLight ? "#111827" : "#d1d1d1";
      const titleColor = isLight ? "#111827" : "white";
      const footerColor = isLight ? "#6b7280" : "white";
      const borderColor = isLight ? "#e5e7eb" : "#333333";
      const backgroundStyle = isLight 
        ? `radial-gradient(circle at top right, ${pColorHex}15 0%, #ffffff 600px), #ffffff`
        : `radial-gradient(circle at top right, ${pColorHex}25 0%, #0a0a0a 600px), #0a0a0a`;

      // Contenedor temporal (fuera de la vista)
      const hiddenContainer = document.createElement("div");
      hiddenContainer.style.position = "absolute";
      hiddenContainer.style.left = "-9999px";
      hiddenContainer.style.top = "0";
      document.body.appendChild(hiddenContainer);

      const stanzas = lyrics.split(/\n\s*\n/);
      const cols = 3; 
      
      const linesPerColumnCover = 28; // Cabecera ocupa espacio
      const linesPerColumnNormal = 38; 
      
      let pagesHtml: string[] = [];
      let currentPageHtml = "";
      let currentLinesInsideColumn = 0;
      let currentColumn = 0;
      let cPage = 0;

      const finishPage = () => {
         pagesHtml.push(currentPageHtml);
         currentPageHtml = "";
         currentColumn = 0;
         currentLinesInsideColumn = 0;
         cPage++;
      };

      const startColumn = () => {
         return `<div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 24px;">`;
      };
      
      const getHeader = () => `
         <div style="margin-bottom: 32px; text-align: center; display: flex; flex-direction: column; align-items: center; border-bottom: 1px solid ${borderColor}; padding-bottom: 24px;">
            <h2 style="color: ${titleColor}; font-size: 48px; font-weight: 300; font-family: ui-sans-serif, system-ui, sans-serif; margin: 0 0 8px 0; letter-spacing: -2px;">${song.toUpperCase()}</h2>
            <h3 style="color: ${pColorHex}; font-size: 12px; font-weight: bold; font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; letter-spacing: 0.4em; text-transform: uppercase;">${artist.toUpperCase()}</h3>
         </div>
         <div style="display: flex; flex-direction: row; gap: 32px; flex: 1; align-items: flex-start;">
      `;
      const getFooter = (pageNum: number) => `
         </div>
         <div style="margin-top: auto; padding-top: 24px; border-top: 1px solid ${borderColor}; display: flex; justify-content: space-between; align-items: center; opacity: 0.6;">
            <p style="font-size: 8px; font-weight: bold; letter-spacing: 0.3em; text-transform: uppercase; color: ${footerColor}; margin: 0; line-height: 1.6; font-family: ui-sans-serif, system-ui, sans-serif;">
               POWERED BY LYRICS.OVH<br/>
               LETRA OBTENIDA A TRAVÉS DE CHORDPRO<br/>
               <span style="opacity: 0.5; letter-spacing: 0.1em;">PÁGINA ${pageNum + 1}</span>
            </p>
            <span style="font-size: 24px; font-weight: 900; letter-spacing: -1px; color: ${footerColor}; font-family: ui-sans-serif, system-ui, sans-serif; margin: 0;">C</span>
         </div>
      `;

      currentPageHtml += getHeader();
      currentPageHtml += startColumn();

      stanzas.forEach(stanza => {
         const sLines = stanza.split('\n');
         const blocksNeeded = sLines.length + 1; // +1 espacio visual extra
         const maxL = cPage === 0 ? linesPerColumnCover : linesPerColumnNormal;

         if (currentLinesInsideColumn + blocksNeeded > maxL && currentLinesInsideColumn > 0) {
            currentPageHtml += `</div>`; // Cerrar columna
            currentColumn++;
            currentLinesInsideColumn = 0;
            
            if (currentColumn >= cols) {
               currentPageHtml += getFooter(cPage);
               finishPage();
               
               // Nueva página, no lleva cabecera completa 
               currentPageHtml += `
                 <div style="display: flex; flex-direction: row; gap: 40px; flex: 1; align-items: flex-start;">
               `;
               currentPageHtml += startColumn();
            } else {
               currentPageHtml += startColumn(); // Nueva columna en la misma página
            }
         }

         const stanzaHtml = `
            <div style="color: ${textColorMain}; font-size: 16px; line-height: 1.7; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; font-weight: 400; white-space: pre-wrap;">${stanza}</div>
         `;
         currentPageHtml += stanzaHtml;
         currentLinesInsideColumn += blocksNeeded;
      });
      
      currentPageHtml += `</div>`; // Cerrar última columna
      currentPageHtml += getFooter(cPage); 
      pagesHtml.push(currentPageHtml);

      if (pagesHtml.length === 1) {
         // Exportar una sola imagen
         const pageDiv = document.createElement("div");
         pageDiv.style.width = `${a4Width}px`;
         pageDiv.style.height = `${a4Height}px`;
         pageDiv.style.background = backgroundStyle;
         pageDiv.style.padding = `${margin}px`;
         pageDiv.style.boxSizing = "border-box";
         pageDiv.style.display = "flex";
         pageDiv.style.flexDirection = "column";
         pageDiv.innerHTML = pagesHtml[0];
         hiddenContainer.appendChild(pageDiv);

         const dataUrl = await toPng(pageDiv, { quality: 1.0, pixelRatio: 2 });
         const link = document.createElement("a");
         link.download = `${song.toLowerCase().replace(/\s+/g, '-')}-letra-a4.png`;
         link.href = dataUrl;
         link.click();
      } else {
         // Exportar múltiples imágenes en ZIP
         for (let i = 0; i < pagesHtml.length; i++) {
            const pageDiv = document.createElement("div");
            pageDiv.style.width = `${a4Width}px`;
            pageDiv.style.height = `${a4Height}px`;
            pageDiv.style.background = backgroundStyle;
            pageDiv.style.padding = `${margin}px`;
            pageDiv.style.boxSizing = "border-box";
            pageDiv.style.display = "flex";
            pageDiv.style.flexDirection = "column";
            pageDiv.innerHTML = pagesHtml[i];
            hiddenContainer.appendChild(pageDiv);

            const dataUrl = await toPng(pageDiv, { quality: 1.0, pixelRatio: 2 });
            const base64Data = dataUrl.replace(/^data:image\/(png|jpg);base64,/, "");
            zip.file(`${song.toLowerCase().replace(/\s+/g, '-')}-pag-${i + 1}.png`, base64Data, { base64: true });
            
            // Limpiar
            hiddenContainer.removeChild(pageDiv);
         }

         const content = await zip.generateAsync({ type: "blob" });
         saveAs(content, `${song.toLowerCase().replace(/\s+/g, '-')}-letras.zip`);
      }
      
      document.body.removeChild(hiddenContainer);
      showToast("¡Exportación Completada " + (pagesHtml.length > 1 ? "en ZIP" : "") + "!");
    } catch (err) {
      console.error(err);
      showToast("Error al exportar PNG(s).");
    }
  }, [song, lyrics, artist, settings.colorTheme, showToast]);

  const handleExportPDF = useCallback(() => {
    if (!lyrics) return;
    try {
      showToast("Generando PDF estructurado...");
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      const margin = 20;
      const maxLineWidth = pdfWidth - margin * 2;
      
      // Theme parser for jsPDF
      // Theme parser for jsPDF
      const themeColorsRGB: Record<string, [number, number, number]> = {
        "theme-amber": [217, 119, 6], "theme-forest": [4, 120, 87], "theme-blue": [37, 99, 235],
        "theme-red": [220, 38, 38], "theme-orange": [234, 88, 12], "theme-cyan": [8, 145, 178],
        "theme-purple": [147, 51, 234], "theme-lime": [101, 163, 13], "theme-teal": [13, 148, 136],
        "theme-indigo": [79, 70, 229], "theme-violet": [124, 58, 237], "theme-fuchsia": [192, 38, 211],
        "theme-rose": [225, 29, 72], "theme-slate": [71, 85, 105], "theme-gray": [75, 85, 99], "theme-zinc": [82, 82, 91]
      };
      const pColor = themeColorsRGB[settings.colorTheme as keyof typeof themeColorsRGB] || [217, 119, 6];

      const isLight = !document.documentElement.classList.contains('dark');
      const paintBg = () => {
        if (isLight) {
          pdf.setFillColor(255, 255, 255);
        } else {
          pdf.setFillColor(15, 15, 15);
        }
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      };

      paintBg();

      // TITULO
      if (isLight) pdf.setTextColor(17, 24, 39);
      else pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(28);
      // @ts-ignore: charSpace exists in jspdf types
      pdf.text(song.toUpperCase(), pdfWidth / 2, margin + 18, { align: "center", charSpace: 1 });
      
      // ARTISTA (Color Primario)
      pdf.setTextColor(pColor[0], pColor[1], pColor[2]); 
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      // @ts-ignore
      pdf.text(artist.toUpperCase(), pdfWidth / 2, margin + 28, { align: "center", charSpace: 3 });

      // Separator Line
      if (isLight) pdf.setDrawColor(229, 231, 235);
      else pdf.setDrawColor(40, 40, 40);
      pdf.setLineWidth(0.3);
      pdf.line(margin, margin + 38, pdfWidth - margin, margin + 38);

      // TEXTO DE LA CANCIÓN
      if (isLight) pdf.setTextColor(17, 24, 39);
      else pdf.setTextColor(220, 220, 220); // Better contrast matching PNG
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10.5);
      
      // 3 Columns matching image
      const cols = 3;
      const columnGap = 12;
      const colWidth = (pdfWidth - margin * 2 - columnGap * (cols - 1)) / cols;
      const columnPositions = [margin, margin + colWidth + columnGap, margin + (colWidth + columnGap) * 2];
      
      let cursorY = margin + 50;
      let currentStartY = margin + 50;
      let currentColumn = 0;
      
      const stanzas = lyrics.split(/\n\s*\n/);
      
      stanzas.forEach((stanza: string) => {
        const lines = pdf.splitTextToSize(stanza, colWidth);
        const stanzaHeight = lines.length * 6;
        
        // Break to next column or page if stanza doesn't fit
        if (cursorY + stanzaHeight > pdfHeight - margin - 25) {
          currentColumn++;
          if (currentColumn >= cols) {
             pdf.addPage();
             paintBg();
             currentColumn = 0;
             currentStartY = margin + 20;
             cursorY = currentStartY;
          } else {
             cursorY = currentStartY; // Reset to top for next column
          }
        }
        
        pdf.text(lines, columnPositions[currentColumn], cursorY);
        cursorY += stanzaHeight + 8; // Spacer between stanzas
      });

      // FOOTER MATCHING PNG
      if (cursorY > pdfHeight - margin - 20 && currentColumn === cols - 1) {
         pdf.addPage();
         paintBg();
      }
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.5);
      pdf.setTextColor(100, 100, 100);
      // @ts-ignore
      pdf.text("POWERED BY LYRICS.OVH", margin, pdfHeight - margin, { align: "left", charSpace: 1 });
      // @ts-ignore
      pdf.text("LETRA OBTENIDA A TRAVÉS DE CHORDPRO", margin, pdfHeight - margin + 4, { align: "left", charSpace: 1 });
      
      pdf.setFontSize(12);
      pdf.text("C", pdfWidth - margin, pdfHeight - margin + 2, { align: "right" });

      pdf.save(`${song.toLowerCase().replace(/\s+/g, '-')}-letra-nativa.pdf`);
      showToast("¡PDF nativo exportado!");
    } catch (err) {
      console.error(err);
      showToast("Error al exportar PDF estructurado.");
    }
  }, [song, lyrics, artist, showToast]);

  const handleExportDOCX = useCallback(async () => {
    if (!lyrics) return;
    try {
      const lines = lyrics.split('\n');
      const paragraphs = lines.map(line => 
        new Paragraph({
          children: [new TextRun(line)],
        })
      );

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: `${song.toUpperCase()}`, bold: true, size: 36 })],
            }),
            new Paragraph({
              children: [new TextRun({ text: `${artist.toUpperCase()}`, color: "555555", size: 24 })],
            }),
            new Paragraph({ text: "" }),
            ...paragraphs
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${song.toLowerCase().replace(/\s+/g, '-')}-letra.docx`);
    } catch (err) {
      console.error(err);
      alert("Error al exportar DOCX.");
    }
  }, [lyrics, song, artist]);

  if (!isHydrated) return null;

  return (
    <div className={`min-h-[100svh] bg-background text-foreground transition-colors duration-500 font-sans selection:bg-primary/30 selection:text-white relative overflow-hidden flex flex-col ${settings.colorTheme}`}>
      <GlobalAnimatedBackground />
      <Navbar variant="transparent" />
      
      <div className="relative z-10 pt-36 pb-32 px-6 sm:px-10 max-w-4xl w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both flex-grow">
        
        {/* CABECERA BUSCADOR ESTÉTICA PREMIUM */}
        <div className="mb-12 text-center flex flex-col items-center">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tighter mb-4 text-foreground">
            lyrics<span className="text-primary font-light">.global</span>
          </h1>
          <p className="text-sm font-bold tracking-[0.4em] text-muted-foreground uppercase opacity-70">
            Encuentra La Letra Original
          </p>
        </div>
        
        {/* INPUT DE BÚSQUEDA FLOTANTE Y DROPDOWN */}
        <div className="relative mb-24 max-w-5xl w-full mx-auto" ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit}>
            <div className="relative flex items-center shadow-2xl w-full shadow-primary/5 rounded-full ring-1 ring-border bg-background focus-within:ring-2 focus-within:ring-primary transition-all duration-300">
               <span className="pl-8 text-2xl text-muted-foreground">♪</span>
               <input
                 type="text"
                 value={query}
                 onChange={handleQueryChange}
                 onFocus={() => { if (query.trim()) setShowSuggestions(true); }}
                 placeholder="Busca por canción o artista..."
                 className="flex-1 w-full bg-transparent py-4 px-6 text-xl sm:text-2xl font-light text-foreground outline-none placeholder:text-muted-foreground/40"
                 autoComplete="off"
                 autoFocus
               />
               {isLoading && (
                 <div className="pr-6 flex items-center gap-2 text-primary text-xs font-bold tracking-widest uppercase animate-pulse">
                   Descargando...
                 </div>
               )}
            </div>
          </form>

          {/* DROPDOWN DE RESULTADOS */}
          {showSuggestions && (
            <div className="absolute top-[calc(100%+12px)] left-0 w-full bg-background/80 backdrop-blur-3xl rounded-3xl shadow-2xl border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300">
              
              {isSuggesting && suggestions.length === 0 && (
                 <div className="p-8 text-center text-sm font-medium tracking-widest uppercase text-muted-foreground animate-pulse">
                   Consultando bases mundiales...
                 </div>
              )}

              {!isSuggesting && query && suggestions.length === 0 && (
                 <div className="p-8 text-center text-sm font-medium text-muted-foreground">
                   Las ondas no traen resultados. Prueba otra vez.
                 </div>
              )}

              {suggestions.length > 0 && (
                 <div className="flex flex-col py-2">
                   {suggestions.map((s, index) => (
                     <div 
                       key={s.id} 
                       onClick={() => handleSelectSuggestion(s)}
                       className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors group ${index !== suggestions.length - 1 ? 'border-b border-border/50' : ''} hover:bg-accent`}
                     >
                        <div className="flex-1 flex flex-col gap-1">
                          <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                            {s.title}
                          </span>
                          <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
                            {s.artist.name}
                          </span>
                        </div>
                        <div className="flex items-center text-primary opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                           <span className="text-xl">&rarr;</span>
                        </div>
                     </div>
                   ))}
                 </div>
              )}
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-4 mb-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs text-center rounded-lg border border-red-200 dark:border-red-900/50 max-w-xl mx-auto">
            {errorMsg}
          </div>
        )}
        
        {/* VISOR DE LETRA (RESULTADO) */}
        {!isLoading && lyrics && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 w-full">
            
            {/* ACTIONS MÁS SUTILES */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-10 w-full">
              <button 
                onClick={handleSendToEditor}
                className="px-6 py-3 bg-foreground text-background text-xs font-bold tracking-widest uppercase rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2 border border-transparent"
              >
                ✨ Poner Acordes (Ir al Estudio)
              </button>
              
              <div className="w-px h-6 bg-border mx-2 hidden sm:block"></div>
              
              <button onClick={handleCopy} className="text-[10px] font-bold tracking-[0.2em] bg-accent text-foreground hover:bg-primary hover:text-primary-foreground uppercase transition-colors px-4 py-2.5 rounded-full">
                Copiar
              </button>
              <button onClick={handleExportPNG} className="text-[10px] font-bold tracking-[0.2em] bg-accent text-foreground hover:bg-primary hover:text-primary-foreground uppercase transition-colors px-4 py-2.5 rounded-full">
                PNG
              </button>
              <button onClick={handleExportPDF} className="text-[10px] font-bold tracking-[0.2em] bg-accent text-foreground hover:bg-primary hover:text-primary-foreground uppercase transition-colors px-4 py-2.5 rounded-full outline-white ring-1 ring-inset ring-border">
                PDF
              </button>
              <button onClick={handleExportDOCX} className="text-[10px] font-bold tracking-[0.2em] bg-accent text-foreground hover:bg-primary hover:text-primary-foreground uppercase transition-colors px-4 py-2.5 rounded-full">
                DOCX (Word)
              </button>
            </div>

            {/* THE LYRICS CANVAS - DISEÑO AWWWARDS MINIMALISTA - COMPACTO */}
            <div 
              ref={canvasRef}
              className="bg-background text-foreground p-8 sm:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-border w-full relative overflow-hidden group max-w-5xl mx-auto rounded-3xl"
            >
              {/* Deco Glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[100px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>

              <div className="relative z-10 w-full text-center mb-8 pb-6 border-b border-border">
                 <h2 className="text-3xl sm:text-5xl font-light tracking-tighter mb-2 text-foreground">
                   {song.toUpperCase()}
                 </h2>
                 <h3 className="text-xs font-bold tracking-[0.4em] text-primary uppercase">
                   {artist}
                 </h3>
              </div>
              
              <div className={`columns-1 sm:columns-2 md:columns-3 gap-8 px-2 sm:px-6 mx-auto text-sm sm:text-base leading-relaxed ${settings.fontFamily} ${settings.alignment} text-foreground/90`}>
                {lyrics.split(/\n\s*\n/).map((stanza, idx) => (
                  <div key={idx} className="break-inside-avoid mb-6 whitespace-pre-wrap">
                    {stanza}
                  </div>
                ))}
              </div>
              
              <div className="mt-12 pt-6 border-t border-border flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity text-foreground">
                 <p className="text-[7px] font-bold tracking-[0.3em] uppercase">
                   POWERED BY LYRICS.OVH<br/>
                   LETRA OBTENIDA A TRAVÉS DE CHORDPRO
                 </p>
                 <span className="text-lg font-black tracking-tighter shrink-0 text-foreground">C</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TOAST ELEGANTE */}
      {toastMsg && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
           <div className="bg-foreground text-background px-6 py-3 rounded-full text-xs font-bold tracking-widest uppercase shadow-2xl flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              {toastMsg}
           </div>
        </div>
      )}
    </div>
  );
}
