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
  const formattedSections = song?.sections?.slice(0, 2) || []; // Primeras dos líneas de la canción para el banner

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
               Social Media
             </button>
          </div>

          <div className="p-6 flex-1 flex flex-col gap-8">
            {activeTab === "documentos" ? (
              <div className="flex flex-col gap-6 animate-in fade-in">
                 <div className="space-y-3">
                   <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Formato de Salida</label>
                   <div className="grid grid-cols-2 gap-3">
                      <button onClick={onExportPDF} disabled={isExporting} className="border border-border bg-background py-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:text-primary transition-all disabled:opacity-50 group">
                        <span className="text-2xl group-hover:scale-110 transition-transform">📄</span>
                        <span className="text-[10px] font-bold tracking-widest uppercase">Multi-Pág PDF</span>
                      </button>
                      <button onClick={onExportPNG} disabled={isExporting} className="border border-border bg-background py-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:text-primary transition-all disabled:opacity-50 group">
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
              <div className="flex flex-col gap-6 animate-in fade-in">
                 <div className="space-y-3">
                   <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Formato de Red Social</label>
                   <div className="flex flex-col gap-2">
                     {["instagram-story", "instagram-post", "youtube-thumbnail"].map(fmt => (
                        <button
                          key={fmt}
                          onClick={() => setSocialFormat(fmt)}
                          className={`text-left px-4 py-3 rounded-xl border text-xs font-bold tracking-tight uppercase transition-all flex items-center justify-between ${socialFormat === fmt ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                        >
                          {fmt.replace("-", " ")}
                          {socialFormat === fmt && <span>✓</span>}
                        </button>
                     ))}
                   </div>
                 </div>

                 <button
                   onClick={handleExportSocial}
                   disabled={isExporting}
                   className="w-full bg-foreground text-background py-4 rounded-xl text-xs font-black tracking-[0.2em] uppercase hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-xl mt-4"
                 >
                   {isExporting ? "Generando..." : "Descargar Recurso"}
                 </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Preview Area */}
        <div className="flex-1 bg-zinc-900 flex items-center justify-center p-8 overflow-hidden relative">
          <div className="absolute top-6 left-6 text-zinc-500 font-bold text-[10px] tracking-[0.3em] uppercase">Vista Previa en Vivo</div>
          <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-colors z-50">✕</button>
          
          {activeTab === "redes" ? (
             <div className="scale-[0.4] sm:scale-50 lg:scale-[0.6] origin-center transition-all duration-500">
               {/* CONTENEDOR GENERADO PARA IMAGEN SOCIAL - ESCALADO PERO RESOLUCIÓN NATIVA */}
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
             </div>
          ) : (
             <div className="text-center">
               <div className="w-32 h-40 bg-white shadow-2xl mx-auto rounded-lg border flex flex-col items-center justify-center gap-2 opacity-50 mb-6">
                 <div className="w-20 h-1 bg-gray-200"></div>
                 <div className="w-16 h-1 bg-gray-200"></div>
                 <div className="w-24 h-1 bg-gray-200"></div>
               </div>
               <p className="text-zinc-500 font-medium text-sm">El diseño final se basará en la configuración de márgenes y estilo fuente actualmente en uso.</p>
             </div>
          )}

        </div>

      </div>
    </div>
  );
}
