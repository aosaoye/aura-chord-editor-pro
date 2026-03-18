"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useGlobalSettings } from "../context/SettingsContext";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { Search, Map, Music, Mic2, Heart, ArrowRight, Smartphone, Compass, Clock } from "lucide-react";

interface Suggestion {
  id: number;
  title: string;
  artist: { name: string };
  albumName?: string;
  duration?: number;
  plainLyrics?: string;
  source?: string;
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
        
        // 1) Motor Principal: LRCLIB (Más Robusto, incluye lyrics en la misma response)
        try {
          const lrclibRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(val)}`);
          if (lrclibRes.ok) {
            const lrclibData = await lrclibRes.json();
            if (Array.isArray(lrclibData) && lrclibData.length > 0) {
              finalSuggestions = lrclibData.map((t: any) => ({
                id: t.id,
                title: t.trackName,
                artist: { name: t.artistName },
                albumName: t.albumName,
                duration: t.duration,
                plainLyrics: t.plainLyrics,
                source: "lrclib"
              }));
            }
          }
        } catch (lrclibErr) {
          console.warn("LRCLib fallback triggered.");
        }

        // 2) Motor Secundario: OVH API (Si LRCLIB falla o no encuentra mucho)
        if (finalSuggestions.length < 3) {
           const ovhRes = await fetch(`https://api.lyrics.ovh/suggest/${encodeURIComponent(val)}`);
           if (ovhRes.ok) {
              const ovhData = await ovhRes.json();
              if (ovhData && ovhData.data) {
                const ovhMapped = ovhData.data.map((t: any) => ({
                   id: t.id,
                   title: t.title,
                   artist: { name: t.artist.name },
                   source: "ovh"
                }));
                finalSuggestions = [...finalSuggestions, ...ovhMapped];
              }
           }
        }

        // Limpiar duplicados
        const unique = finalSuggestions.filter((v: Suggestion, i: number, a: Suggestion[]) => 
          a.findIndex((t) => (t.title.toLowerCase() === v.title.toLowerCase() && t.artist.name.toLowerCase() === v.artist.name.toLowerCase())) === i
        );

        setSuggestions(unique.slice(0, 7)); // Top 7 hits
      } catch (e) {
        console.error("Error fetching suggestions");
      } finally {
        setIsSuggesting(false);
      }
    }, 450); 
  };

  const fetchLyricsFallback = async (artistName: string, songName: string) => {
    setIsLoading(true);
    setErrorMsg("");
    setLyrics("");

    try {
      // Intentar primero LRCLib directo por nombre
      const lrclibUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artistName.trim())}&track_name=${encodeURIComponent(songName.trim())}`;
      const lrcRes = await fetch(lrclibUrl);
      if (lrcRes.ok) {
         const lrcData = await lrcRes.json();
         if (lrcData && lrcData.plainLyrics) {
            setLyrics(lrcData.plainLyrics);
            return;
         }
      }

      // Si no, volver a OVH
      const ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artistName.trim())}/${encodeURIComponent(songName.trim())}`;
      const res = await fetch(ovhUrl);
      const data = await res.json();

      if (data.lyrics) {
        setLyrics(data.lyrics);
      } else {
        setErrorMsg(`"${songName}" de ${artistName} está protegida por copyright o no disponible en los motores de búsqueda públicos globales.`);
      }
    } catch (err) {
      console.error("Error al conectar con la API:", err);
      setErrorMsg("Error de conexión satelital.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = async (s: Suggestion) => {
    setArtist(s.artist.name);
    setSong(s.title);
    setQuery(`${s.title} - ${s.artist.name}`);
    setShowSuggestions(false);
    
    // Auto-cargamos estilo Google Knowledge Graph
    if (s.plainLyrics) {
       setLyrics(s.plainLyrics);
    } else {
       await fetchLyricsFallback(s.artist.name, s.title);
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
      showToast("¡Texto copiado!");
    } catch (err) {
      showToast("Error de portapapeles.");
    }
  }, [lyrics, showToast]);

  const handleSendToEditor = useCallback(() => {
    if (!lyrics) return;
    localStorage.setItem("chordpro-draft-lyrics", lyrics);
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    localStorage.setItem("chordpro-draft-title", `${cap(song)} - ${cap(artist)}`);
    router.push("/editor");
  }, [lyrics, song, artist, router]);

  const handleExportPNG = useCallback(async () => {
    if (!canvasRef.current || !lyrics) return;
    try {
      const dataUrl = await toPng(canvasRef.current, {
        quality: 1.0, pixelRatio: 2, backgroundColor: "#000"
      });
      const link = document.createElement("a");
      link.download = `${song.toLowerCase().replace(/\s+/g, '-')}-lyrics.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert("Error exportando PNG.");
    }
  }, [song, lyrics]);

  const handleExportPDF = useCallback(() => {
    if (!lyrics) return;
    try {
      showToast("Compilando PDF...");
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 20;
      
      const themeColors: Record<string, [number, number, number]> = {
        "theme-amber": [245, 158, 11],
        "theme-violet": [139, 92, 246],
        "theme-emerald": [16, 185, 129],
        "theme-rose": [244, 63, 94],
        "theme-sky": [14, 165, 233],
      };
      const pColor = themeColors[settings.colorTheme] || [245, 158, 11];

      const paintBg = () => {
        pdf.setFillColor(15, 15, 15);
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      };
      paintBg();

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(24);
      // @ts-ignore
      pdf.text(song.toUpperCase(), margin, margin + 15, { align: "left" });
      
      pdf.setTextColor(pColor[0], pColor[1], pColor[2]); 
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      // @ts-ignore
      pdf.text(artist.toUpperCase(), margin, margin + 25, { align: "left", charSpace: 2 });

      pdf.setDrawColor(40, 40, 40);
      pdf.setLineWidth(0.3);
      pdf.line(margin, margin + 35, pdfWidth - margin, margin + 35);

      pdf.setTextColor(220, 220, 220); 
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10.5);
      
      const cols = 2;
      const columnGap = 16;
      const colWidth = (pdfWidth - margin * 2 - columnGap) / cols;
      const columnPositions = [margin, margin + colWidth + columnGap];
      
      let cursorY = margin + 45;
      let currentStartY = margin + 45;
      let currentColumn = 0;
      
      const stanzas = lyrics.split(/\n\s*\n/);
      
      stanzas.forEach((stanza: string) => {
        const lines = pdf.splitTextToSize(stanza, colWidth);
        const stanzaHeight = lines.length * 5.5;
        
        if (cursorY + stanzaHeight > pdfHeight - margin - 20) {
          currentColumn++;
          if (currentColumn >= cols) {
             pdf.addPage();
             paintBg();
             currentColumn = 0;
             currentStartY = margin + 20;
             cursorY = currentStartY;
          } else {
             cursorY = currentStartY; 
          }
        }
        
        pdf.text(lines, columnPositions[currentColumn], cursorY);
        cursorY += stanzaHeight + 7; 
      });

      if (cursorY > pdfHeight - margin - 15 && currentColumn === cols - 1) {
         pdf.addPage();
         paintBg();
      }
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      pdf.text("POWERED BY AURACHORDS GLOBAL ENGINE", margin, pdfHeight - margin);

      pdf.save(`${song.toLowerCase()}-letra.pdf`);
      showToast("PDF Exportado");
    } catch (err) {
      showToast("Error exportando PDF");
    }
  }, [song, lyrics, artist, settings.colorTheme, showToast]);

  const handleExportDOCX = useCallback(async () => {
    if (!lyrics) return;
    try {
      const lines = lyrics.split('\n');
      const paragraphs = lines.map(line => new Paragraph({ children: [new TextRun(line)] }));
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({ children: [new TextRun({ text: `${song.toUpperCase()}`, bold: true, size: 36 })] }),
            new Paragraph({ children: [new TextRun({ text: `${artist.toUpperCase()}`, color: "555555", size: 24 })] }),
            new Paragraph({ text: "" }),
            ...paragraphs
          ],
        }],
      });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${song.toLowerCase()}-letra.docx`);
    } catch (err) {
      alert("Error DOCX");
    }
  }, [lyrics, song, artist]);

  if (!isHydrated) return null;

  return (
    <div className={`min-h-screen bg-[#050505] text-white transition-colors duration-500 font-sans selection:bg-primary selection:text-white ${settings.colorTheme}`}>
      <Navbar variant="transparent" className="bg-[#050505]/90 backdrop-blur-xl border-b border-white/5" />
      
      {/* 1. HERO SECTION (Musixmatch Style Aesthetic) */}
      <section className="relative w-full pt-44 pb-20 px-6 lg:px-12 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Glow Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[150px] rounded-[100%] pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter mb-6 leading-none text-white drop-shadow-2xl">
            Distribute your lyrics <span className="text-primary block sm:inline mt-2">everywhere</span>
          </h1>
          <p className="text-lg sm:text-xl font-medium text-white/70 max-w-2xl text-center mb-12">
            AuraChords is the all-in-one search engine for discovering, translating, and importing global lyrics directly into your studio session.
          </p>

          {/* SEARCH BAR WIDGET */}
          <div className="w-full max-w-3xl relative" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit}>
              <div className="flex items-center w-full bg-[#111] border border-white/10 rounded-2xl shadow-2xl focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all overflow-hidden">
                <div className="pl-6 pr-4 py-5 text-white/40">
                  {isLoading ? (
                    <span className="w-6 h-6 border-[3px] border-primary border-t-transparent rounded-full block animate-spin"></span>
                  ) : (
                    <Search size={26} />
                  )}
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  onFocus={() => { if (query.trim()) setShowSuggestions(true); }}
                  placeholder="Search over 6 million songs..."
                  className="w-full bg-transparent border-none outline-none py-6 pr-6 text-xl text-white placeholder:text-white/30 font-medium"
                  autoComplete="off"
                />
              </div>
            </form>

            {/* DROPDOWN - Apple Music / Spotify Aesthetic */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-[#111]/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl z-50 overflow-hidden transform transition-all">
                {isSuggesting && suggestions.length === 0 && (
                  <div className="p-8 text-center text-sm font-bold tracking-[0.2em] text-white/40 animate-pulse uppercase">
                    Scraping Global APIs...
                  </div>
                )}
                {!isSuggesting && query && suggestions.length === 0 && (
                  <div className="p-8 text-center text-sm font-medium text-white/40">
                    No results found in the synchronized databases.
                  </div>
                )}
                {suggestions.length > 0 && (
                  <div className="flex flex-col py-2 max-h-[400px] overflow-y-auto hide-scrollbar">
                    {suggestions.map((s) => (
                      <button 
                        key={`${s.id}-${s.title}`}
                        onClick={() => handleSelectSuggestion(s)}
                        className="flex items-center text-left gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group"
                      >
                         <div className="w-12 h-12 rounded-md bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-primary/30 transition-colors">
                           <Music size={20} className="text-white/30 group-hover:text-primary transition-colors" />
                         </div>
                         <div className="flex flex-col flex-1 overflow-hidden">
                           <span className="text-base font-bold text-white truncate">{s.title}</span>
                           <div className="flex items-center gap-2 mt-0.5">
                             <span className="text-sm font-medium text-white/50 truncate tracking-wide">{s.artist.name}</span>
                             {s.plainLyrics && (
                               <span className="text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded font-black tracking-widest uppercase">Verified Sync</span>
                             )}
                           </div>
                         </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ERROR PANEL */}
      {errorMsg && (
        <div className="max-w-3xl mx-auto px-6 mb-12 animate-in fade-in">
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center rounded-2xl font-medium">
            {errorMsg}
          </div>
        </div>
      )}

      {/* 2. RESULTS GRAPH (Google Knowledge Panel Hybrid) */}
      {!isLoading && lyrics && (
        <section className="relative w-full px-4 sm:px-10 pb-32 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
            
            {/* PANEL IZQUIERDO: Letras */}
            <div className="w-full lg:w-[65%] order-2 lg:order-1 relative">
              <div 
                ref={canvasRef}
                className="bg-[#0f0f0f] border border-white/10 rounded-[2rem] p-8 sm:p-14 shadow-2xl relative overflow-hidden"
              >
                {/* Glow interno */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] pointer-events-none"></div>

                <div className="mb-10 text-left">
                   <h2 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight">
                     {song}
                   </h2>
                   <p className="text-lg sm:text-xl font-medium text-primary tracking-wide">
                     {artist}
                   </p>
                </div>
                
                <div className="text-lg sm:text-xl leading-relaxed text-white/80 columns-1 sm:columns-2 gap-10 font-medium tracking-wide">
                  {lyrics.split(/\n\s*\n/).map((stanza, idx) => (
                    <div key={idx} className="break-inside-avoid mb-8 whitespace-pre-wrap">
                      {stanza}
                    </div>
                  ))}
                </div>

                <div className="mt-14 pt-8 border-t border-white/5 flex items-center justify-between text-white/30">
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Powered by Aura Global Engine</span>
                  <Map size={16} />
                </div>
              </div>
            </div>

            {/* PANEL DERECHO: Acciones & Metadatos */}
            <div className="w-full lg:w-[35%] order-1 lg:order-2 flex flex-col gap-6 sticky top-28">
              <div className="bg-primary/10 border border-primary/20 rounded-3xl p-8 flex flex-col gap-6 shadow-xl relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 
                 <div className="relative z-10 flex flex-col gap-2">
                   <h3 className="text-3xl font-black text-white leading-tight">Send to Studio Mode</h3>
                   <p className="text-white/60 font-medium text-sm">Automatically parse this lyrics sheet into the editor and add chords instantly.</p>
                 </div>

                 <button 
                  onClick={handleSendToEditor}
                  className="relative z-10 w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold tracking-[0.1em] uppercase hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(var(--primary-raw),0.2)]"
                 >
                   Open in Editor <ArrowRight size={18} />
                 </button>
              </div>

              <div className="bg-[#111] border border-white/5 rounded-3xl p-8 flex flex-col gap-4">
                 <h4 className="text-[11px] font-bold tracking-[0.2em] text-white/40 uppercase mb-2">Export Toolkit</h4>
                 <div className="grid grid-cols-2 gap-3">
                   <button onClick={handleExportPDF} className="bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-semibold py-4 rounded-xl transition-colors flex flex-col items-center justify-center gap-2">
                     <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                     PDF Document
                   </button>
                   <button onClick={handleExportPNG} className="bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-semibold py-4 rounded-xl transition-colors flex flex-col items-center justify-center gap-2">
                     <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     PNG Image
                   </button>
                   <button onClick={handleExportDOCX} className="bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-semibold py-4 rounded-xl transition-colors flex flex-col items-center justify-center gap-2 col-span-2">
                     Word (DOCX)
                   </button>
                 </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. MARKETING SECTION (Musixmatch Style Info) */}
      {!lyrics && (
        <section className="w-full bg-[#0a0a0a] border-t border-white/5 py-32 mt-12 relative overflow-hidden">
           {/* Background numbers fake text */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none opacity-[0.03] select-none">
             <span className="text-[25vw] font-black leading-none">6M+</span>
           </div>

           <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
             <h2 className="text-6xl sm:text-8xl font-black mb-4 tracking-tighter text-white">
               <span className="text-primary">6,312,201</span> SONGS
             </h2>
             <p className="text-xl sm:text-2xl text-white/60 mb-20 max-w-3xl font-medium leading-relaxed">
               Manage, distribute, and verify your lyrics directly inside the professional Chord Editor, synced seamlessly with global providers.
             </p>

             <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-5xl">
               <div className="bg-[#111] border border-white/5 rounded-[2rem] p-10 flex flex-col items-center gap-4 text-center hover:bg-white/5 transition-colors">
                 <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                   <Clock size={28} />
                 </div>
                 <h4 className="text-xl font-bold text-white">Lightning Fast</h4>
                 <p className="text-white/50 leading-relaxed font-medium">Bypass hours of manual typing. Pull lyrics from synchronized APIs globally in milliseconds.</p>
               </div>
               <div className="bg-[#111] border border-white/5 rounded-[2rem] p-10 flex flex-col items-center gap-4 text-center hover:bg-white/5 transition-colors">
                 <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                   <Compass size={28} />
                 </div>
                 <h4 className="text-xl font-bold text-white">Knowledge Graph</h4>
                 <p className="text-white/50 leading-relaxed font-medium">Get accurate artist mapping. Export beautifully crafted PDFs with perfect layouts and typography.</p>
               </div>
               <div className="bg-[#111] border border-white/5 rounded-[2rem] p-10 flex flex-col items-center gap-4 text-center hover:bg-white/5 transition-colors">
                 <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                   <Smartphone size={28} />
                 </div>
                 <h4 className="text-xl font-bold text-white">Studio Integration</h4>
                 <p className="text-white/50 leading-relaxed font-medium">Move instantly to the Chord Editor panel. Add chords over syllables perfectly synchronized.</p>
               </div>
             </div>
           </div>
        </section>
      )}

      {/* TOAST ELEGANTE */}
      {toastMsg && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
           <div className="bg-white text-black px-6 py-3 rounded-full text-xs font-bold tracking-widest uppercase shadow-2xl flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              {toastMsg}
           </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
