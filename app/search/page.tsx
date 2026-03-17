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

interface Suggestion {
  id: number;
  title: string;
  artist: { name: string };
  album?: { cover_medium?: string };
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
        const res = await fetch(`https://api.lyrics.ovh/suggest/${encodeURIComponent(val)}`);
        const data = await res.json();
        if (data && data.data) {
          // Filtrar duplicados por nombre+artista
          const unique = data.data.filter((v: Suggestion, i: number, a: Suggestion[]) => 
            a.findIndex((t) => (t.title.toLowerCase() === v.title.toLowerCase() && t.artist.name.toLowerCase() === v.artist.name.toLowerCase())) === i
          );
          setSuggestions(unique.slice(0, 6)); // Top 6 hits
        }
      } catch (e) {
        console.error("Error fetching suggestions");
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
      const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artistName.trim())}/${encodeURIComponent(songName.trim())}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.lyrics) {
        setLyrics(data.lyrics);
      } else {
        setErrorMsg(`La letra de "${songName}" no está en el servidor global.`);
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
    await fetchLyrics(s.artist.name, s.title);
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

  const handleSendToEditor = useCallback(() => {
    if (!lyrics) return;
    localStorage.setItem("chordpro-draft-lyrics", lyrics);
    
    // Capitalize first letters of song and artist for a better title
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    localStorage.setItem("chordpro-draft-title", `${cap(song)} - ${cap(artist)}`);
    
    router.push("/editor");
  }, [lyrics, song, artist, router]);

  const handleExportPNG = useCallback(async () => {
    if (!canvasRef.current || !lyrics) return;
    try {
      // Capturamos con un color de fondo gris súper oscuro fijo para exportación
      const exportBgColor = "#0a0a0a";
      const dataUrl = await toPng(canvasRef.current, {
        quality: 1.0, pixelRatio: 2, backgroundColor: exportBgColor
      });
      const link = document.createElement("a");
      link.download = `${song.toLowerCase().replace(/\s+/g, '-')}-letra.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Error al exportar PNG.");
    }
  }, [song, lyrics]);

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
      const themeColors: Record<string, [number, number, number]> = {
        "theme-amber": [245, 158, 11],
        "theme-violet": [139, 92, 246],
        "theme-emerald": [16, 185, 129],
        "theme-rose": [244, 63, 94],
        "theme-sky": [14, 165, 233],
      };
      const pColor = themeColors[settings.colorTheme] || [245, 158, 11];

      const paintBg = () => {
        pdf.setFillColor(15, 15, 15); // #0f0f0f (Similar to PNG background)
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      };

      paintBg();

      // TITULO (Blanco, normal weight, elegant)
      pdf.setTextColor(255, 255, 255);
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
      pdf.setDrawColor(40, 40, 40);
      pdf.setLineWidth(0.3);
      pdf.line(margin, margin + 38, pdfWidth - margin, margin + 38);

      // TEXTO DE LA CANCIÓN
      pdf.setTextColor(220, 220, 220); // Better contrast matching PNG
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
    <div className={`min-h-screen bg-background text-foreground transition-colors duration-500 font-sans selection:bg-primary selection:text-white ${settings.colorTheme}`}>
      <Navbar 
        centerContent={
          <div className="hidden lg:flex items-center gap-12 text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">
            <Link href="/" className="cursor-pointer hover:text-black dark:hover:text-white transition-colors">Inicio</Link>
            <span className="cursor-pointer text-black dark:text-white border-b-2 border-black dark:border-white pb-1">Buscador</span>
            <Link href="/settings" className="cursor-pointer hover:text-black dark:hover:text-white transition-colors">Configuración</Link>
            <Link href="/editor" className="cursor-pointer hover:text-black dark:hover:text-white transition-colors">Estudio</Link>
          </div>
        }
      />
      
      <div className="pt-36 pb-32 px-6 sm:px-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
        
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
        <div className="relative mb-24 w-full max-w-2xl mx-auto" ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit}>
            <div className="relative flex items-center shadow-2xl shadow-primary/5 rounded-full ring-1 ring-border bg-background focus-within:ring-2 focus-within:ring-primary transition-all duration-300">
               <span className="pl-6 text-xl text-muted-foreground">♪</span>
               <input
                 type="text"
                 value={query}
                 onChange={handleQueryChange}
                 onFocus={() => { if (query.trim()) setShowSuggestions(true); }}
                 placeholder="Busca por canción o artista..."
                 className="w-full bg-transparent py-5 px-4 text-lg font-medium text-foreground outline-none placeholder:text-muted-foreground/50 h-16"
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
              style={{ backgroundColor: '#0a0a0a', borderColor: '#1a1a1a' }}
              className="text-[#ededed] p-8 sm:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-[#222] dark:border-[#1a1a1a] w-full relative overflow-hidden group max-w-5xl mx-auto"
            >
              {/* Deco Glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[100px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>

              <div className="relative z-10 w-full text-center mb-8 pb-6 border-b border-[#333]">
                 <h2 className="text-3xl sm:text-5xl font-light tracking-tighter mb-2 text-white">
                   {song.toUpperCase()}
                 </h2>
                 <h3 className="text-xs font-bold tracking-[0.4em] text-primary uppercase">
                   {artist}
                 </h3>
              </div>
              
              <div className={`columns-1 sm:columns-2 md:columns-3 gap-8 px-2 sm:px-6 mx-auto text-sm sm:text-base leading-relaxed ${settings.fontFamily} ${settings.alignment} text-[#d1d1d1]`}>
                {lyrics.split(/\n\s*\n/).map((stanza, idx) => (
                  <div key={idx} className="break-inside-avoid mb-6 whitespace-pre-wrap">
                    {stanza}
                  </div>
                ))}
              </div>
              
              <div className="mt-12 pt-6 border-t border-[#333] flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
                 <p className="text-[7px] font-bold tracking-[0.3em] uppercase">
                   POWERED BY LYRICS.OVH<br/>
                   LETRA OBTENIDA A TRAVÉS DE CHORDPRO
                 </p>
                 <span className="text-lg font-black tracking-tighter shrink-0 text-white">C</span>
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
