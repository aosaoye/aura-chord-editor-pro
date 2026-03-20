"use client";

import { useState, useRef } from "react";
import { toPng } from "html-to-image";
import { formatChordText } from "../helpers/chordFormatter";

// Omitir Generar Portada temporalmente (es opcional)
export default function ExportModal({
  song,
  colorTheme,
  onClose,
  onExportPDF,
  onExportPNG,
  includeDictionary = true,
  setIncludeDictionary
}: any) {
  const [activeTab, setActiveTab] = useState("documentos"); // documentos | redes
  const [isExporting, setIsExporting] = useState(false);
  
  // Opciones de Redes
  const [socialFormat, setSocialFormat] = useState("instagram-story");
  const socialRef = useRef<HTMLDivElement>(null);

  const handleExportSocial = async () => {
    if (!socialRef.current) return;
    try {
      setIsExporting(true);
      // Wait for React to paint the UI before synchronous toPng locks main thread
      await new Promise(r => setTimeout(r, 150));
      const dataUrl = await toPng(socialRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `${song.title.toLowerCase().replace(/\s+/g, "-")}-${socialFormat}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Error generando imagen para redes sociales.");
    } finally {
      setIsExporting(false);
    }
  };

  const formattedTitle = song?.title || "Sin Título";
  const isPosterMode = socialFormat === 'poster-cinematico';
  const formattedSections = isPosterMode ? (song?.sections || []) : (song?.sections?.slice(0, 2) || []); 
  const isShortLyrics = isPosterMode && formattedSections.length <= 2;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-background border border-border w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in slide-in-from-bottom-12 duration-500 h-[85vh]">
              {/* Left Sidebar - Options */}
        <div className="w-full md:w-80 bg-muted/30 border-r border-border flex flex-col hide-scrollbar overflow-y-auto">
          <div className="p-6 border-b border-border">
            <h2 className="text-2xl font-black tracking-tight">Exportación Pro</h2>
            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mt-2">Configura tu salida</p>
          </div>

          <div className="flex p-2 gap-2 border-b border-border bg-muted/50">
             <button 
               onClick={() => setActiveTab("documentos")}
               className={`flex-1 text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl transition-all ${activeTab === 'documentos' ? 'bg-background shadow-md border border-border text-foreground' : 'text-muted-foreground hover:bg-muted'}`}
             >
               Partituras
             </button>
             <button 
               onClick={() => setActiveTab("redes")}
               className={`flex-1 text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl transition-all ${activeTab === 'redes' ? 'bg-background shadow-md border border-border text-foreground' : 'text-muted-foreground hover:bg-muted'}`}
             >
               Especiales
             </button>
          </div>

          <div className="p-6 flex-1 flex flex-col gap-8">
            {activeTab === "documentos" ? (
              <div className="flex flex-col gap-6 animate-in fade-in">
                 <div className="space-y-3">
                   <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Formato de Salida</label>
                   <div className="grid grid-cols-2 gap-3">
                      <button onClick={onExportPDF} disabled={isExporting} className="border border-border bg-background py-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:text-primary transition-all disabled:opacity-50 group shadow-sm">
                        <span className="text-2xl group-hover:scale-110 transition-transform">📄</span>
                        <span className="text-[10px] font-bold tracking-widest uppercase">Multi-Pág PDF</span>
                      </button>
                      <button onClick={onExportPNG} disabled={isExporting} className="border border-border bg-background py-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:text-primary transition-all disabled:opacity-50 group shadow-sm">
                        <span className="text-2xl group-hover:scale-110 transition-transform">🖼️</span>
                        <span className="text-[10px] font-bold tracking-widest uppercase">Imágenes PNG</span>
                      </button>
                   </div>
                 </div>

                 <div className="space-y-3">
                   <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Ajustes Avanzados</label>
                   <div className="flex flex-col gap-2">
                     <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-accent/50 transition-colors">
                       <input 
                         type="checkbox" 
                         className="w-4 h-4 accent-primary" 
                         checked={includeDictionary}
                         onChange={(e) => setIncludeDictionary(e.target.checked)}
                       />
                       <span className="text-xs font-semibold">Diagramas al Final</span>
                     </label>
                     <label className="flex items-center justify-between gap-3 p-3 border border-border rounded-xl cursor-not-allowed opacity-50 relative overflow-hidden group hover:bg-accent/50 transition-colors" title="Próximamente">
                       <div className="flex items-center gap-3">
                         <input type="checkbox" className="w-4 h-4" disabled />
                         <span className="text-xs font-semibold line-through">Generar Portada</span>
                       </div>
                       <span className="text-[8px] bg-primary/20 text-primary px-2 py-1 rounded-sm uppercase font-bold tracking-widest">Pronto</span>
                     </label>
                     <label className="flex items-center justify-between gap-3 p-3 border border-border rounded-xl cursor-not-allowed opacity-50 hover:bg-accent/50 transition-colors">
                       <div className="flex items-center gap-3">
                         <input type="checkbox" className="w-4 h-4" disabled />
                         <span className="text-xs font-semibold line-through">Acordes para Zurdos</span>
                       </div>
                       <span className="text-[8px] bg-primary/20 text-primary px-2 py-1 rounded-sm uppercase font-bold tracking-widest">Pronto</span>
                     </label>
                   </div>
                 </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 animate-in fade-in h-full">
                 <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                   <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Estilos Visuales</label>
                   <div className="flex flex-col gap-2">
                     {["poster-cinematico", "instagram-story", "instagram-post", "youtube-thumbnail"].map(fmt => {
                        const isPoster = fmt === "poster-cinematico";
                        return (
                        <button
                          key={fmt}
                          onClick={() => setSocialFormat(fmt)}
                          className={`text-left px-4 py-3 rounded-xl border text-xs font-bold tracking-[0.1em] uppercase transition-all flex flex-col justify-center gap-1 ${socialFormat === fmt ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{fmt.replace("-", " ")}</span>
                            {socialFormat === fmt && <span>✓</span>}
                          </div>
                          {isPoster && <span className="text-[9px] font-medium opacity-70 tracking-normal normal-case">Letras + Acordes en Poster Multicolumna Oscuro</span>}
                        </button>
                      )})}
                   </div>
                 </div>

                 <button
                   onClick={handleExportSocial}
                   disabled={isExporting}
                   className="w-full bg-foreground text-background py-4 rounded-xl text-xs font-black tracking-[0.2em] uppercase hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-xl mt-4 shrink-0"
                 >
                   {isExporting ? "Generando..." : "Descargar Recurso"}
                 </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Preview Area */}
        <div className="flex-1 bg-zinc-900 flex flex-col items-center justify-start overflow-y-auto overflow-x-hidden relative">
           <div className="sticky top-0 w-full z-50 flex justify-between p-6 pointer-events-none">
              <div className="text-zinc-500 font-bold text-[10px] tracking-[0.3em] uppercase">Vista Previa en Vivo</div>
              <button onClick={onClose} className="w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-colors pointer-events-auto">✕</button>
           </div>
           
           <div className="w-full h-full flex items-start justify-center pb-32">
              {activeTab === "redes" ? (
                 <div className={`origin-top transition-all duration-500 flex items-start justify-center ${
                   socialFormat === 'poster-cinematico' 
                      ? 'scale-[0.25] sm:scale-[0.3] md:scale-[0.35] lg:scale-[0.4] xl:scale-[0.45] 2xl:scale-[0.5]' 
                      : 'scale-[0.35] sm:scale-[0.4] md:scale-50 lg:scale-[0.55]'
                 }`}>
               
               {socialFormat === 'poster-cinematico' ? (
                 <div 
                   ref={socialRef}
                   className="shrink-0 flex justify-center p-16 sm:p-24 relative overflow-hidden bg-[#0a0a09] w-[1920px] min-h-[1080px] h-auto font-sans"
                 >
                   {/* Background Gradient/Noise subtle effect */}
                   <div className="absolute inset-0 bg-gradient-to-b from-[#111] to-[#050505] opacity-80 pointer-events-none"></div>
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[800px] bg-orange-900/10 blur-[150px] rounded-full pointer-events-none"></div>

                   <div className="relative z-10 w-full max-w-[1600px] flex flex-col items-center">
                     {/* Elegant Title */}
                     <h1 className="text-white font-[200] text-[4rem] tracking-[0.2em] uppercase text-center w-full leading-tight mb-4 drop-shadow-lg px-8 max-w-[1500px] break-words">
                       {formattedTitle || "VASIJA QUEBRANTADA"}
                     </h1>
                     
                     {/* Elegant Orange Subtitle */}
                     <h2 className="text-[#ea580c] font-black text-xl tracking-[0.5em] uppercase text-center w-full mb-16 drop-shadow-md">
                       {song?.artist || "AURA CHORDS PRO STUDIO"}
                     </h2>
                     
                     <hr className="w-full border-t border-white/10 mb-16" />

                     {/* Multi-Column Lyrics Container */}
                     <div className={`w-full ${isShortLyrics ? 'flex flex-col items-center justify-center text-center mt-20' : 'text-left'}`} style={{ columns: isShortLyrics ? 'auto' : '3 400px', columnGap: '6rem' }}>
                       {formattedSections.map((sec: any, idx: number) => (
                         <div key={idx} className={`mb-14 break-inside-avoid shadow-sm group ${isShortLyrics ? 'w-full max-w-4xl mx-auto' : ''}`}>
                           {sec.lines.map((line: any, lIdx: number) => (
                              <div key={lIdx} className={`mb-7 flex flex-wrap content-start relative font-sans leading-none min-h-[50px] pt-8 ${isShortLyrics ? 'justify-center items-end' : 'items-end'}`}>
                                {line.words.map((word: any, wIdx: number) => (
                                  <div key={word.id || wIdx} className="flex mr-2">
                                    {word.syllables.map((syl: any, i: number) => {
                                      let chordHtml = "";
                                      if (syl.chord) {
                                        const { root, variation, bass } = formatChordText(syl.chord, "english");
                                        chordHtml = `${root}<sup class="ml-[1px] font-normal opacity-80">${variation}</sup>${bass ? `<span class="ml-1 opacity-60">/</span>${bass}` : ''}`;
                                      }
                                      return (
                                        <div key={syl.id || i} className="relative flex flex-col justify-end text-center group cursor-text transition-all duration-200">
                                          {chordHtml && (
                                            <span 
                                              className="absolute bottom-full mb-2 text-[#eb5f15] text-[18px] font-bold font-sans tracking-tight min-w-max left-1/3 -translate-x-1/3 z-10" 
                                              dangerouslySetInnerHTML={{ __html: chordHtml }}
                                            />
                                          )}
                                          <span className="text-white/85 text-[24px] font-[300] leading-none whitespace-pre relative z-0">
                                            {syl.text}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                           ))}
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               ) : (
                 <div 
                   ref={socialRef}
                   className={`flex flex-col items-center justify-center overflow-hidden relative p-12 bg-black ${colorTheme}
                     ${socialFormat === 'instagram-story' ? 'w-[1080px] h-[1920px]' : 
                       socialFormat === 'instagram-post' ? 'w-[1080px] h-[1080px]' : 'w-[1920px] h-[1080px]'}
                   `}
                 >
                    {/* Decorative background vectors */}
                    <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-primary/20 blur-[150px] mix-blend-screen rounded-full opacity-60"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-blue-500/20 blur-[200px] mix-blend-screen rounded-full opacity-40"></div>

                    {/* Letras Cita */}
                    <div className="relative z-10 flex flex-col items-center text-center gap-12 max-w-[80%]">
                      <span className="text-primary text-6xl opacity-50 italic font-serif">"</span>
                      <h2 className="text-white font-black leading-tight tracking-tight text-[5rem] drop-shadow-2xl">
                        {formattedSections[0]?.lines?.[0]?.words?.map((w: any) => w.syllables.map((s: any) => s.text).join('')).join(' ') || "Siento la unción fresca"}
                        <br/>
                        <span className="text-white/60">
                          {formattedSections[0]?.lines?.[1]?.words?.map((w: any) => w.syllables.map((s: any) => s.text).join('')).join(' ') || "cayendo sobre mi."}
                        </span>
                      </h2>
                      
                      <div className="h-2 w-32 bg-primary rounded-full mt-4 shadow-[0_0_30px_rgba(var(--primary-raw),1)]"></div>

                      <div className="mt-8 flex flex-col items-center gap-4">
                        <p className="text-3xl font-bold tracking-[0.2em] text-white/50 uppercase">{formattedTitle}</p>
                        <div className="flex items-center gap-4 mt-6">
                          <div className="flex items-center justify-center w-20 h-20 rounded-full border-4 border-white/10 bg-white/5 backdrop-blur-xl">
                             <span className="text-2xl">🎵</span>
                          </div>
                          <div className="text-left">
                            <p className="text-2xl font-black text-white tracking-widest uppercase">Aura Chords</p>
                            <p className="text-xl text-primary font-bold tracking-widest mt-1">Descubre mi obra completa</p>
                          </div>
                        </div>
                      </div>
                    </div>
                 </div>
               )}
              </div>
          ) : (
             <div className="text-center">
               <div className="w-32 h-40 bg-white shadow-2xl mx-auto rounded-lg border flex flex-col items-center justify-center gap-2 opacity-50 mb-6">
                 <div className="w-20 h-1 bg-gray-200"></div>
                 <div className="w-16 h-1 bg-gray-200"></div>
                 <div className="w-24 h-1 bg-gray-200"></div>
               </div>
               <p className="text-zinc-500 font-medium text-sm">El diseño final de los Documentos PDF/PNG se basará en la configuración de márgenes y estilo fuente actualmente en uso interactivo.</p>
             </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
