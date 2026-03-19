"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { toPng } from "html-to-image";
import SyllableComponent from "../components/SyllableComponent";
import MiniPiano2D from '../components/MiniPiano2D';
import { Song, Chord, Word } from "../config/config";
import { parseTextToSong } from "../config/parseTextToSong";
import { jsPDF } from "jspdf";
import { transposeSong } from "../helpers/transpose";
import { NotationType, formatChordText } from "../helpers/chordFormatter";
import { paginateSong } from "../helpers/pagination";
import { useGlobalSettings } from "../context/SettingsContext";
import { useTeleprompter } from "../hooks/useTeleprompter";
import { getChordKeys } from "../helpers/chordToPianoKeys";
import { useUser } from "@clerk/nextjs";
import PurchaseButton from "../components/PurchaseButton";
import StarRatingInteractive from "../components/StarRatingInteractive";
import GsapWrapper from "../components/GsapWrapper";
import dynamic from 'next/dynamic';

// En lugar de import Piano3D from '../components/Piano3D', haz esto:
const Piano3D = dynamic(() => import('../components/Piano3D'), {
  ssr: false, // Fundamental para librerías 3D (Three.js) que dependen de 'window'
  loading: () => <div className="h-64 w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Cargando motor 3D...</div>
});
import ExportModal from "../components/ExportModal";
import { useAutosaveSong } from "../hooks/useAutosaveSong";
import { offlineStorage } from "../utils/offlineStorage";

export default function SongEditor() {
  const [song, setSong] = useState<Song | null>(null);
  const [songPrice, setSongPrice] = useState<number>(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { user } = useUser();

  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);
  const [dragOverDirection, setDragOverDirection] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null);
  const [includeChordsDictionary, setIncludeChordsDictionary] = useState(true);

  // --- Opciones Musicales de Sesión ---
  const [songKey, setSongKey] = useState('C');

  // Consumimos Settings Globales
  const { settings } = useGlobalSettings();
  const { fontFamily, fontSize, lineHeight, alignment, colorTheme, notation } = settings;

  const uniqueChords = useMemo(() => {
    if (!song) return [];
    const chordsSet = new Map<string, Chord>();
    song.sections.forEach(sec => {
      sec.lines.forEach(line => {
        line.words.forEach(word => {
          word.syllables.forEach(syl => {
            if (syl.chord) {
              const id = `${syl.chord.rootNote}-${syl.chord.variation}-${syl.chord.bassNote}`;
              if (!chordsSet.has(id)) chordsSet.set(id, syl.chord);
            }
          })
        })
      })
    });
    return Array.from(chordsSet.values());
  }, [song]);

  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const [titleInput, setTitleInput] = useState("");
  const [bpmInput, setBpmInput] = useState(120);
  const [timeSignatureInput, setTimeSignatureInput] = useState("4/4");
  const [lyricsInput, setLyricsInput] = useState("");

  const [toastMsg, setToastMsg] = useState("");

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  }, []);

  const lienzoRef = useRef<HTMLDivElement>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);

  const [offlineModalMsg, setOfflineModalMsg] = useState<{title: string, message: string} | null>(null);

  const [show3DPiano, setShow3DPiano] = useState(false);
  const [editorColumns, setEditorColumns] = useState<number>(0);
  const [editorMargin, setEditorMargin] = useState<'estrecho' | 'normal' | 'amplio'>('normal');
  const [active3DChord, setActive3DChord] = useState<Chord | null>(null);

  // Hook del Teleprompter
  const { isPlaying, activeLineId, activeChord, togglePlay } = useTeleprompter(song);

  // 🚀 NUEVO: Hook de Autoguardado
  const { status: autosaveStatus, lastSaved, forceSave } = useAutosaveSong(song, isPlaying, () => {
    // Callback opcional: se ejecuta cuando el guardado es exitoso
    showToast("Guardado automático exitoso");
  });

  // Escuchar cuando se hace clic en un acorde (manual) para mostrarlo en el 3D
  useEffect(() => {
    const handlePickerOpened = (e: CustomEvent) => {
      const sylId = e.detail;
      let foundChord: Chord | null = null;
      // Search the entire song for this syllable's chord
      song?.sections.forEach(s => s.lines.forEach(l => l.words.forEach(w => w.syllables.forEach(syl => {
        if (syl.id === sylId && syl.chord) foundChord = syl.chord;
      }))));
      if (foundChord) setActive3DChord(foundChord);
    };

    const handlePianoPlay = (e: CustomEvent) => {
      setActive3DChord(e.detail);
    };

    window.addEventListener('chord-picker-opened', handlePickerOpened as EventListener);
    window.addEventListener('piano-play-chord', handlePianoPlay as EventListener);
    return () => {
      window.removeEventListener('chord-picker-opened', handlePickerOpened as EventListener);
      window.removeEventListener('piano-play-chord', handlePianoPlay as EventListener);
    }
  }, [song]);

  // Actualizar Acorde 3D cronológicamente guiado por el motor del Teleprompter
  useEffect(() => {
    if (isPlaying && show3DPiano && activeChord) {
      setActive3DChord(activeChord);
    }
  }, [isPlaying, activeChord, show3DPiano]);

  // Auto-scroll Inteligente en Slider (A4) o Presentación
  useEffect(() => {
    if (isPlaying && activeLineId) {
      const presentElement = document.getElementById(`present-${activeLineId}`);
      if (presentElement) {
        const container = presentElement.closest('.overflow-y-auto') as HTMLElement;
        if (container) {
          const containerHalf = container.offsetHeight / 2;
          const elementHalf = presentElement.offsetHeight / 2;

          // Calculo matemático de alineación perfecta al centro excluyendo los parches de CSS
          const targetScroll = (presentElement.offsetTop - containerHalf) + elementHalf;

          container.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
          });
        } else {
          presentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        const activeElement = document.getElementById(activeLineId);
        if (activeElement) {
          // Obtenemos la página donde está y hacemos scroll en el container de las páginas
          const pageEnclosing = activeElement.closest('.a4-page');
          if (pageEnclosing && pagesContainerRef.current) {
            pageEnclosing.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [isPlaying, activeLineId]);

  // Hook Importación del Buscador (LocalStorage) + AutoRecover + Load from DB
  useEffect(() => {
    const draftLyrics = localStorage.getItem("chordpro-draft-lyrics");
    const draftTitle = localStorage.getItem("chordpro-draft-title");

    const urlParams = new URLSearchParams(window.location.search);
    const songId = urlParams.get('id');
    const isNew = urlParams.get('new');

    if (isNew === 'true') {
      localStorage.removeItem("chordpro-draft-lyrics");
      localStorage.removeItem("chordpro-draft-title");
      localStorage.removeItem("chordpro-draft-song");
      setIsAnimating(false);
      setSong(null);
      setTitleInput("");
      setLyricsInput("");
      setBpmInput(120);

      // Limpiar URL para que no siga diciendo new=true al guardar
      window.history.replaceState(null, '', '/editor');
      return;
    }

    if (songId) {
      setIsAnimating(true);
      fetch(`/api/songs?id=${songId}`)
        .then(res => {
          if (!res.ok) throw new Error("Fallo de red");
          return res.json();
        })
        .then(data => {
          if (data.songs && data.songs.length > 0) {
            const found = data.songs.find((s: any) => s.id === songId) || data.songs[0];
            if (found && found.parsedData) {
              try {
                const loadedSong = typeof found.parsedData === 'string' ? JSON.parse(found.parsedData) : found.parsedData;
                loadedSong.id = found.id;
                loadedSong.userId = found.userId;
                loadedSong.authorName = found.user?.name;
                setSong(loadedSong);
                
                // 🚀 SENIOR FIX: Al cargar online, guardamos una copia offline
                offlineStorage.saveSong(loadedSong).catch(console.error);
                
                if (found.price != null) {
                  setSongPrice(Number(found.price));
                }
              } catch (e) { console.error("Error parsing song", e); }
            }
          } else {
            showToast("⚠️ " + (data.error || "No se pudo cargar la obra."));
          }
          setIsAnimating(false);
        })
        .catch(async () => {
             // 🚀 SENIOR FIX: FALLBACK OFFLINE
             console.log("Online fetch failed, trying offline storage...");
             try {
                 const offlineSong = await offlineStorage.getSong(songId);
                 if (offlineSong) {
                     setSong(offlineSong);
                     setOfflineModalMsg({
                       title: "Modo Sin Conexión Activado", 
                       message: "Estás visualizando una copia offline de esta canción. Los cambios se guardarán localmente y no se sincronizarán hasta que recuperes la conexión."
                     });
                 } else {
                     setOfflineModalMsg({
                       title: "Error de Conexión", 
                       message: "No se pudo cargar la canción online ni se encontró una copia offline en tu dispositivo."
                     });
                 }
             } catch(err) {
                 showToast("❌ Error crítico: no se pudo cargar la obra offline.");
             } finally {
                 setIsAnimating(false);
             }
        });
      return;
    }

    if (draftLyrics && draftTitle) {
      setTitleInput(draftTitle);
      setLyricsInput(draftLyrics);

      // Limpiamos Search Redirects
      localStorage.removeItem("chordpro-draft-lyrics");
      localStorage.removeItem("chordpro-draft-title");

      // Auto-procesamos la canción
      setIsAnimating(true);
      setTimeout(() => {
        const parsedSong = parseTextToSong(draftLyrics, draftTitle, 120, "4/4");
        setSong(parsedSong);
        setIsAnimating(false);
      }, 500);
    } else {
      // Mecanismo de Salto de Emergencia: Si la página se recargó, recuperar obra en proceso
      const savedDraft = localStorage.getItem("chordpro-draft-song");
      if (savedDraft) {
        try {
          setIsAnimating(true);
          setTimeout(() => {
            setSong(JSON.parse(savedDraft));
            setIsAnimating(false);
          }, 500);
        } catch (e) { }
      }
    }
  }, []);

  // Guardado en caliente (Hot Save) cada vez que se modifique un acorde o algo en el Editor
  useEffect(() => {
    if (song) {
      localStorage.setItem("chordpro-draft-song", JSON.stringify(song));
    }
  }, [song]);

  // 🚀 NUEVO: Al cerrar la pestaña o navegar, forzamos el guardado final
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Si hay cambios pendientes, intentamos forzar el guardado
      if (autosaveStatus === 'dirty') {
        forceSave();
        // Nota: En navegadores modernos, esto puede no completarse si es muy rápido,
        // pero es mejor que perderlo.
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [autosaveStatus, forceSave]);

  // Rest of imports...
  const handleImport = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!titleInput.trim() || !lyricsInput.trim()) {
        showToast("El título y la letra son necesarios para comenzar.");
        return;
      }

      setIsAnimating(true);

      setTimeout(() => {
        const parsedSong = parseTextToSong(lyricsInput, titleInput, bpmInput, timeSignatureInput);
        setSong(parsedSong);
        setIsAnimating(false);
      }, 500);
    },
    [titleInput, bpmInput, lyricsInput, timeSignatureInput]
  );

  const handleChordChange = useCallback((syllableId: string, newChord: Chord | null) => {
    setSong((currentSong) => {
      if (!currentSong) return currentSong;
      const updatedSections = currentSong.sections.map((section) => ({
        ...section,
        lines: section.lines.map((line) => ({
          ...line,
          words: line.words.map((word) => ({
            ...word,
            syllables: word.syllables.map((syl) =>
              syl.id === syllableId ? { ...syl, chord: newChord } : syl
            ),
          })),
        })),
      }));
      return { ...currentSong, sections: updatedSections };
    });
  }, []);

  const handleSectionRepeatChange = useCallback((sectionId: string) => {
    setSong((currentSong) => {
      if (!currentSong) return currentSong;
      const updatedSections = currentSong.sections.map((section) => {
        if (section.id === sectionId) {
          const nextRepeat = (section.repeat || 1) >= 4 ? 1 : (section.repeat || 1) + 1;
          return { ...section, repeat: nextRepeat };
        }
        return section;
      });
      return { ...currentSong, sections: updatedSections };
    });
  }, []);

  const handleDeleteSection = useCallback((sectionId: string) => {
    setSong((currentSong) => {
      if (!currentSong) return currentSong;
      const updatedSections = currentSong.sections.filter(s => s.id !== sectionId);
      return { ...currentSong, sections: updatedSections };
    });
  }, []);

  const handleDuplicateSection = useCallback((sectionId: string) => {
    setSong((currentSong) => {
      if (!currentSong) return currentSong;
      const sectionToDuplicate = currentSong.sections.find(s => s.id === sectionId);
      if (!sectionToDuplicate) return currentSong;

      const newSection = JSON.parse(JSON.stringify(sectionToDuplicate));
      newSection.id = `sec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      newSection.title = newSection.title ? `${newSection.title} (Copia)` : '';
      newSection.lines.forEach((line: any) => {
        line.id = `line-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        line.words.forEach((word: any) => {
          word.id = `word-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          word.syllables.forEach((syl: any) => {
            syl.id = `syl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          });
        });
      });

      const updatedSections = [...currentSong.sections];
      const index = updatedSections.findIndex(s => s.id === sectionId);
      updatedSections.splice(index + 1, 0, newSection);
      
      return { ...currentSong, sections: updatedSections };
    });
  }, []);

  const handleSectionTypeChange = useCallback((sectionId: string, newType: string) => {
    setSong((currentSong) => {
      if (!currentSong) return currentSong;
      const updatedSections = currentSong.sections.map((section) => {
        if (section.id === sectionId) {
          return { ...section, type: newType };
        }
        return section;
      });
      return { ...currentSong, sections: updatedSections };
    });
  }, []);

  const handleLineRepeatChange = useCallback((sectionId: string, lineId: string) => {
    setSong((currentSong) => {
      if (!currentSong) return currentSong;
      const updatedSections = currentSong.sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            lines: section.lines.map((line) => {
              if (line.id === lineId) {
                const nextRepeat = (line.repeat || 1) >= 4 ? 1 : (line.repeat || 1) + 1;
                return { ...line, repeat: nextRepeat };
              }
              return line;
            }),
          };
        }
        return section;
      });
      return { ...currentSong, sections: updatedSections };
    });
  }, []);

  const handleTranspose = useCallback((semitones: number) => {
    setSong((currentSong) => {
      if (!currentSong) return currentSong;
      return transposeSong(currentSong, semitones);
    });
  }, []);

  const handleAddTrailingChord = useCallback((sectionId: string, lineId: string) => {
    setSong((currentSong) => {
      if (!currentSong) return currentSong;
      const updatedSections = currentSong.sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            lines: section.lines.map((line) => {
              if (line.id === lineId) {
                const newWord: Word = {
                  id: `word-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                  syllables: [{
                    id: `syl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                    text: "\u00A0",
                    chord: null
                  }]
                };
                return { ...line, words: [...line.words, newWord] };
              }
              return line;
            }),
          };
        }
        return section;
      });
      return { ...currentSong, sections: updatedSections };
    });
  }, []);

  const handleAutoFillChords = useCallback((targetSectionId: string) => {
    setSong((currentSong) => {
      if (!currentSong) return currentSong;

      const targetIndex = currentSong.sections.findIndex(s => s.id === targetSectionId);
      if (targetIndex <= 0) return currentSong;

      const targetSection = currentSong.sections[targetIndex];

      // Buscar la sección previa más cercana (preferible del mismo tipo) que tenga acordes
      let sourceSection = null;
      for (let i = targetIndex - 1; i >= 0; i--) {
        const sec = currentSong.sections[i];
        const hasChords = sec.lines.some(l => l.words.some(w => w.syllables.some(s => s.chord !== null)));
        if (hasChords && sec.type.toLowerCase() === targetSection.type.toLowerCase()) {
          sourceSection = sec;
          break;
        }
      }

      // Si no encontramos del mismo tipo, agarramos la última sección con acordes simplemente
      if (!sourceSection) {
        for (let i = targetIndex - 1; i >= 0; i--) {
          const sec = currentSong.sections[i];
          const hasChords = sec.lines.some(l => l.words.some(w => w.syllables.some(s => s.chord !== null)));
          if (hasChords) {
            sourceSection = sec;
            break;
          }
        }
      }

      if (!sourceSection) {
        showToast("No hay secciones anteriores con acordes para copiar.");
        return currentSong;
      }

      const updatedSections = currentSong.sections.map((section) => {
        if (section.id === targetSectionId) {
          // Copiado algorítmico 1:1 de acordes basados en línea, palabra y sílaba
          return {
            ...section,
            lines: section.lines.map((line, lIdx) => {
              const sourceLine = sourceSection!.lines[lIdx];
              if (!sourceLine) return line;

              return {
                ...line,
                words: line.words.map((word, wIdx) => {
                  const sourceWord = sourceLine.words[wIdx];
                  if (!sourceWord) return word;

                  return {
                    ...word,
                    syllables: word.syllables.map((syl, sIdx) => {
                      const sourceSyl = sourceWord.syllables[sIdx];
                      return sourceSyl ? { ...syl, chord: sourceSyl.chord } : syl;
                    }),
                  };
                }),
              };
            }),
          };
        }
        return section;
      });

      return { ...currentSong, sections: updatedSections };
    });
  }, []);

  const handleExportToImage = useCallback(async () => {
    if (!song || !pagesContainerRef.current) return;

    if ((song as any).isPreviewRestriction) {
      showToast("🔒 Debes adquirir esta obra Premium para habilitar la descarga en imagen.");
      return;
    }

    try {
      setIsExporting(true);

      const pageNodes = Array.from(pagesContainerRef.current.querySelectorAll('.a4-page')) as HTMLElement[];
      if (pageNodes.length === 0) return;

      if (pageNodes.length === 1) {
        const firstPage = pageNodes[0];
        const bgColor = window.getComputedStyle(firstPage).backgroundColor;
        const a4WidthPx = 794;
        const a4HeightPx = 1123;

        const dataUrl = await toPng(firstPage, {
          quality: 1.0,
          pixelRatio: 2,
          backgroundColor: bgColor,
          width: a4WidthPx,
          height: a4HeightPx,
          style: {
            width: `${a4WidthPx}px`,
            height: `${a4HeightPx}px`,
            minWidth: `${a4WidthPx}px`,
            minHeight: `${a4HeightPx}px`,
            maxWidth: `${a4WidthPx}px`,
            maxHeight: `${a4HeightPx}px`,
            transform: 'none',
            margin: '0'
          }
        });
        const link = document.createElement("a");
        link.download = `${song.title.toLowerCase().replace(/\s+/g, '-')}-score.png`;
        link.href = dataUrl;
        link.click();
      } else {
        showToast("Generando archivo ZIP con Múltiples Páginas...");
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        for (let i = 0; i < pageNodes.length; i++) {
          const pageNode = pageNodes[i];
          const bgColor = window.getComputedStyle(pageNode).backgroundColor;
          const a4WidthPx = 794;
          const a4HeightPx = 1123;

          const dataUrl = await toPng(pageNode, {
            quality: 1.0,
            pixelRatio: 2,
            backgroundColor: bgColor,
            width: a4WidthPx,
            height: a4HeightPx,
            style: {
              width: `${a4WidthPx}px`,
              height: `${a4HeightPx}px`,
              minWidth: `${a4WidthPx}px`,
              minHeight: `${a4HeightPx}px`,
              maxWidth: `${a4WidthPx}px`,
              maxHeight: `${a4HeightPx}px`,
              transform: 'none',
              margin: '0'
            }
          });

          const base64Data = dataUrl.replace(/^data:image\/(png|jpg);base64,/, "");
          zip.file(`${song.title.toLowerCase().replace(/\s+/g, '-')}-pag-${i + 1}.png`, base64Data, { base64: true });
        }

        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.download = `${song.title.toLowerCase().replace(/\s+/g, '-')}-partituras.zip`;
        link.href = URL.createObjectURL(content);
        link.click();
      }

    } catch (err) {
      console.error("Error al exportar:", err);
      showToast("Hubo un error al exportar la partitura como PNG/ZIP.");
    } finally {
      setIsExporting(false);
    }
  }, [song, showToast]);

  const handleExportToPDF = useCallback(async () => {
    if (!song || !pagesContainerRef.current) return;

    if ((song as any).isPreviewRestriction) {
      showToast("🔒 Debes adquirir esta obra Premium para habilitar la descarga en PDF.");
      return;
    }

    try {
      setIsExporting(true);

      const pageNodes = Array.from(pagesContainerRef.current.querySelectorAll('.a4-page')) as HTMLElement[];

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 210;
      const pdfHeight = 297;

      for (let i = 0; i < pageNodes.length; i++) {
        const pageNode = pageNodes[i];
        const bgColor = window.getComputedStyle(pageNode).backgroundColor;

        const a4WidthPx = 794;
        const a4HeightPx = 1123;

        const dataUrl = await toPng(pageNode, {
          quality: 1.0,
          pixelRatio: 2,
          backgroundColor: bgColor,
          width: a4WidthPx,
          height: a4HeightPx,
          style: {
            width: `${a4WidthPx}px`,
            height: `${a4HeightPx}px`,
            minWidth: `${a4WidthPx}px`,
            minHeight: `${a4HeightPx}px`,
            maxWidth: `${a4WidthPx}px`,
            maxHeight: `${a4HeightPx}px`,
            transform: 'none',
            margin: '0'
          }
        });

        if (i > 0) pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`${song.title.toLowerCase().replace(/\s+/g, '-')}-score.pdf`);

    } catch (err) {
      console.error("Error al exportar a PDF:", err);
      showToast("Hubo un error al exportar el PDF.");
    } finally {
      setIsExporting(false);
    }
  }, [song]);

  const handleSaveSong = useCallback(async () => {
    if (!song) return;
    try {
      setIsSaving(true);
      showToast("☁️ Guardando en la nube...");

      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song, price: songPrice })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          showToast("⚠️ " + data.error);
        } else {
          showToast("❌ Error: " + data.error);
        }
        return;
      }

      showToast("✅ ¡Obra guardada exitosamente!");

      // AL GUARDAR (Sobretodo si es la 1ª vez), la BD le ha asignado un UUID real (data.savedSong.id)
      // Actualizamos el objeto local SI el ID ha cambiado para que las próximas veces se actualice
      if (data.savedSong && data.savedSong.id && data.savedSong.id !== song.id) {
        setSong(prev => prev ? { ...prev, id: data.savedSong.id } : prev);

        // Opcional: Modificar la URL sin recargar para que si refresca siga estando en su UUID
        window.history.replaceState(null, '', `/editor?id=${data.savedSong.id}`);
      }

    } catch (err) {
      console.error(err);
      showToast("❌ Hubo un error al guardar o comunicarse con el servidor.");
    } finally {
      setIsSaving(false);
    }
  }, [song, songPrice]);

  const mobileBlocker = (
    <div className="flex lg:hidden min-h-screen bg-background text-foreground flex-col items-center justify-center p-8 text-center pb-32 anim-in fade-in duration-500">
      <span className="text-7xl mb-10 drop-shadow-2xl">📱</span>
      <h1 className="text-3xl font-black tracking-tight mb-6 mt-4">Estudio no disponible</h1>
      <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed border-t border-border pt-6">
        El estudio avanzado de transcripción requiere de una <span className="font-bold text-foreground">Tablet, Laptop o Pantalla Grande</span> para operar los lienzos.
      </p>
      <p className="text-muted-foreground mt-4 text-sm">
        Sin embargo, puedes explorar todas las obras públicas de nuestra comunidad.
      </p>
      <Link href="/community" className="mt-12 px-8 py-4 bg-foreground text-background dark:bg-primary dark:text-primary-foreground rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-2xl text-center">
        Ver Comunidad
      </Link>
    </div>
  );

  // Pantalla 1: Importador (Awwwards Style)
  if (!song) {
    return (
      <>
        {mobileBlocker}
        <div className={`hidden lg:block min-h-screen bg-background text-foreground transition-all duration-700 ease-in-out ${isAnimating ? 'opacity-0' : 'opacity-100'} ${colorTheme}`}>
          {/* Navigation Premium */}
          <Navbar variant="default"
          />

          {/* Hero Form */}
          <div className="pt-32 sm:pt-48 pb-24 px-6 sm:px-10 max-w-4xl mx-auto flex flex-col gap-12 sm:gap-20">
            <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-out fill-mode-both">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-light tracking-tight text-foreground leading-[1.1] break-words">
                Eleva tu <br className="hidden sm:block" /><span className="font-semibold text-primary drop-shadow-sm">composición.</span>
              </h1>
              <p className="text-muted-foreground font-light text-lg sm:text-xl max-w-md">
                Un entorno minimalista y preciso para estructurar, silabear y armonizar tus letras.
              </p>
            </div>

            <form onSubmit={handleImport} className="flex flex-col gap-14 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 ease-out fill-mode-both">

              <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
                <div className="flex-1 space-y-3 group">
                  <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase transition-colors group-focus-within:text-primary">
                    Título de la obra
                  </label>
                  <input
                    type="text"
                    required
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder="Ej: Sonata de Invierno"
                    className="w-full border-b border-border py-3 bg-transparent text-xl sm:text-2xl font-light text-foreground focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/30"
                  />
                </div>

                <div className="w-full sm:w-32 space-y-3 group">
                  <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase transition-colors group-focus-within:text-primary">
                    Tempo (BPM)
                  </label>
                  <input
                    type="number"
                    min="30" max="300"
                    required
                    value={bpmInput}
                    onChange={(e) => setBpmInput(Number(e.target.value))}
                    className="w-full border-b border-border py-3 bg-transparent text-foreground text-xl sm:text-2xl font-light focus:outline-none focus:border-primary transition-all sm:text-center placeholder:text-muted-foreground/30"
                  />
                </div>

                <div className="w-full sm:w-36 space-y-3 group">
                  <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase transition-colors group-focus-within:text-primary">
                    Compás
                  </label>
                  <select
                    value={timeSignatureInput}
                    onChange={(e) => setTimeSignatureInput(e.target.value)}
                    className="w-full border-b border-border py-3 bg-transparent text-foreground text-xl sm:text-2xl font-light focus:outline-none focus:border-primary transition-all sm:text-center placeholder:text-muted-foreground/30 appearance-none"
                  >
                    <option value="4/4">4/4 (Común)</option>
                    <option value="3/4">3/4 (Vals)</option>
                    <option value="2/2">2/2 (Marcha)</option>
                    <option value="6/8">6/8 (Compuesto)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-6 group flex-1">
                <div className="flex justify-between items-end border-b border-border pb-2 transition-colors group-focus-within:border-primary">
                  <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase transition-colors group-focus-within:text-primary">
                    Estructura Lírica
                  </label>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest hidden sm:block">
                    Soporta tags como [Verso], [Coro]
                  </span>
                </div>
                <textarea
                  required
                  value={lyricsInput}
                  onChange={(e) => setLyricsInput(e.target.value)}
                  placeholder="[Verso]&#10;Comienza a escribir o pega tu letra aquí...&#10;&#10;Usa doble salto de línea para separar estrofas."
                  className="w-full min-h-[350px] bg-transparent text-foreground text-lg font-light leading-relaxed focus:outline-none transition-all resize-none placeholder:text-muted-foreground/30"
                ></textarea>
              </div>

              <div className="flex justify-start sm:justify-end pt-4 border-t border-border/50">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-10 sm:px-12 py-5 bg-primary text-primary-foreground text-[10px] font-bold tracking-[0.2em] uppercase transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4 rounded-full shadow-[0_15px_30px_rgba(var(--primary-raw),0.2)] hover:bg-primary/90"
                >
                  Generar Lienzo
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                  </svg>
                </button>
              </div>
            </form>
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
      </>
    );
  }

  // Pantalla 2: El Editor "Canvas"
  // Si la canción está en BDD (tiene userId), y mi ID no coincide (o no estoy logueado), es solo de Lectura!
  const isReadOnly = song?.userId ? song.userId !== user?.id : false;

  const hasMultipleSongs = Array.isArray(song?.sections) && song.sections.filter(s => s.title && /^\d+\.\s/.test(s.title)).length > 1;
  const activeColumns = editorColumns > 0 ? editorColumns : (hasMultipleSongs ? 2 : 1);
  const baseLinesPerColumn = fontSize.includes('2xl') ? 9 : fontSize.includes('xl') ? 12 : fontSize.includes('sm') ? 20 : 15;

  const marginMap = {
    'estrecho': 'p-4 sm:p-6 lg:p-8',
    'normal': 'p-6 sm:p-10 lg:p-16',
    'amplio': 'p-10 sm:p-14 lg:p-24'
  };
  const activeMarginClass = marginMap[editorMargin];

  return (
    <>
      {!isReadOnly && mobileBlocker}
      <div className={`${!isReadOnly ? 'hidden lg:flex' : 'flex'} w-full min-h-screen flex-col bg-background text-foreground transition-colors duration-500 overflow-hidden font-sans selection:bg-primary selection:text-white ${colorTheme} ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>

        {/* Top Fixed Navbar */}
        <Navbar
          variant="editor"
          className={isPreviewMode ? 'hidden' : ''}
          centerContent={
            <div className="hidden lg:flex items-center gap-12 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">

              <button
                onClick={() => {
                  setIsAnimating(true);
                  setTimeout(() => {
                    setSong(null);
                    localStorage.removeItem("chordpro-draft-song"); // Destruimos auto-grabado si sale voluntariamente
                    setIsAnimating(false);
                  }, 500);
                }}
                className="cursor-pointer hover:text-foreground transition-colors flex items-center gap-2"
              >
                ← Atrás
              </button>
              <span>/</span>
              <Link href="/" className="cursor-pointer hover:text-foreground transition-colors">Inicio</Link>
              <Link href="/settings" className="cursor-pointer hover:text-foreground transition-colors">Configuración</Link>
              <span className="cursor-pointer text-primary border-b-2 border-primary pb-1">Estudio</span>
            </div>
          }
          rightContent={
            <div className="flex items-center gap-4 w-full lg:w-auto overflow-x-auto pb-4 lg:pb-0 hide-scrollbar mt-4 lg:mt-0">
              <button
                onClick={() => {
                  if (isPreviewMode && isPlaying) togglePlay();
                  setIsPreviewMode(!isPreviewMode);
                }}
                className="text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-3 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
              >
                {isPreviewMode ? "Salir de Vista Previa" : "Ver Vista Previa"}
              </button>

              <div className="h-4 w-px bg-border hidden sm:block shrink-0"></div>

              <button
                onClick={togglePlay}
                className="flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground text-[10px] font-bold tracking-[0.2em] uppercase hover:scale-105 transition-all active:scale-95 rounded-full shadow-lg shrink-0"
              >
                {isPlaying ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                    </svg>
                    Pausar
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 pl-[2px]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                    Reproducir
                  </>
                )}
              </button>

              {/* Grupo de Exportación */}
              <div className="flex items-center bg-foreground rounded-full overflow-hidden shadow-xl transition-transform active:scale-95 shrink-0">
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-6 py-3 bg-foreground text-background text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 border-r border-background/20 flex items-center gap-2"
                >
                  Exportar Pro
                </button>

                {!isReadOnly && (
                  <button
                    onClick={handleSaveSong}
                    disabled={isSaving || isExporting}
                    className="px-6 py-3 bg-primary text-primary-foreground text-[10px] font-bold tracking-[0.2em] uppercase hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center min-w-[180px]"
                  >
                    {isSaving || autosaveStatus === 'saving' ? (
                      <span className="animate-pulse">Autoguardando...</span>
                    ) : autosaveStatus === 'dirty' ? (
                      'Modificado...'
                    ) : autosaveStatus === 'saved' && lastSaved ? (
                      `Nube: ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    ) : autosaveStatus === 'error' ? (
                      <span className="text-red-200">Error guardando</span>
                    ) : (
                      "Guardar en la Nube"
                    )}
                  </button>
                )}
              </div>
            </div>
          }
        />

        <div className={isPreviewMode ? "flex h-screen w-full bg-muted" : "pt-24 sm:pt-36 pb-32 px-4 sm:px-10 flex flex-col lg:flex-row gap-6 lg:gap-10 items-start justify-center animate-in fade-in zoom-in-95 duration-1000 ease-out fill-mode-both"}>

          {/* PANTALLA COMPLETA PRESENTACIÓN (TELEPROMPTER PROFESIONAL) */}
          {isPlaying && (
            <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-700">
              {/* Compás de Fondo Analógico */}
              <div
                className="absolute inset-0 bg-primary/20 blur-[150px] mix-blend-screen opacity-60 origin-center"
                style={{
                  animation: `pulse ${60 / song.bpm}s infinite ease-in-out`
                }}
              ></div>

              {/* Cabecera Flotante */}
              <div className="absolute top-0 w-full px-8 sm:px-12 py-8 flex justify-between items-center z-50 bg-gradient-to-b from-[#050505]/80 to-transparent backdrop-blur-sm">
                <div className="flex flex-col gap-1">
                  <h3 className="text-white text-xl sm:text-2xl font-bold tracking-tight">{song.title}</h3>
                  <p className="text-primary font-black tracking-[0.3em] uppercase text-[10px] drop-shadow-md">
                    {song.bpm} BPM — Modo Presentación
                  </p>
                </div>
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all backdrop-blur-md shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Letras Gigantes Estilo Spotify */}
              <GsapWrapper animationType="fade-up" duration={1} className="flex-1 w-full overflow-y-auto hide-scrollbar scroll-smooth flex flex-col items-center pt-[45vh] pb-[60vh] px-6 sm:px-10 relative z-20">
                {song.sections.map((sec, sIdx) => (
                  <div key={sec.id} className="w-full max-w-6xl flex flex-col gap-12 sm:gap-16 mb-24 sm:mb-32 text-center items-center">
                    {/* Header de Sección */}
                    <h2 className="text-primary/70 font-bold tracking-[0.4em] text-sm sm:text-lg uppercase mb-4 py-2 px-6 border border-primary/20 rounded-full inline-block">
                      {sec.title || sec.type} {sec.repeat && sec.repeat > 1 ? `(x${sec.repeat})` : ''}
                    </h2>

                    {sec.lines.map((line) => {
                      const isActive = activeLineId === line.id;

                      // Evaluamos si toda la línea tiene algún acorde para reservar el espacio vertical
                      let hasChords = false;
                      line.words.forEach(w => w.syllables.forEach(s => { if (s.chord) hasChords = true; }));

                      return (
                        <div
                          key={line.id}
                          id={`present-${line.id}`}
                          className={`transition-all duration-700 ease-out flex flex-col gap-3 min-w-full items-center justify-center
                             ${isActive ? 'opacity-100 scale-100 drop-shadow-[0_0_20px_rgba(var(--primary-raw),0.4)]' : 'opacity-[0.15] blur-[2px] scale-95'}
                           `}
                        >
                          {/* Texto de la Línea Gigante con Acordes Perfectamente Alineados */}
                          <div className={`text-white font-black tracking-tight leading-normal overflow-visible transition-all duration-500 flex flex-wrap justify-center items-end ${isActive ? 'text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem]' : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl'}`}>
                            {line.words.map((word, wIdx) => (
                              <div key={word.id} className="flex flex-wrap justify-center mr-5 md:mr-8 last:mr-0">
                                {word.syllables.map((syl, i) => (
                                  <div key={syl.id} className="flex flex-col items-start relative pt-6 min-w-max justify-end">

                                    {/* Slot del Acorde (Reserva de altura incluso vacío si la línea lo requiere) */}
                                    {hasChords && (
                                      <div className={`w-full min-h-[1.8em] mb-1 md:mb-2 font-sans font-bold text-primary tracking-widest flex items-end relative leading-normal ${isActive ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-2xl'}`}>
                                        {syl.chord ? (() => {
                                          const formatted = formatChordText(syl.chord, notation, songKey);
                                          // Aseguramos margen derecho dinámico para evitar solapamientos masivos
                                          return (
                                            <span className="flex items-start z-10 pt-1 pr-3 lg:pr-5 whitespace-nowrap overflow-visible">
                                              <span>{formatted.root}</span>
                                              {formatted.variation && (
                                                <span className="text-[0.6em] relative top-0 ml-[1px] font-sans font-bold leading-none">{formatted.variation}</span>
                                              )}
                                              {formatted.bass && (
                                                <span className="text-[0.7em] font-sans font-light opacity-80 ml-[1px] leading-none">/{formatted.bass}</span>
                                              )}
                                            </span>
                                          );
                                        })() : null}
                                      </div>
                                    )}

                                    {/* Sílaba Textual */}
                                    <div className="whitespace-pre">{syl.text}</div>

                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}

                <div className="pt-20 pb-40 text-white/20 font-bold tracking-widest uppercase text-xs">
                  Fin de la canción
                </div>
              </GsapWrapper>
            </div>
          )}

          {/* VISTA PREVIA: HUD FLOTANTE (REEMPLAZA SIDEBAR IMPRESIÓN) */}
          {isPreviewMode && !isPlaying && (
            <div className="fixed bottom-6 lg:bottom-10 right-6 lg:right-10 z-[60] flex items-center gap-3 bg-background/95 backdrop-blur-xl p-2.5 rounded-full border border-border/50 shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
              <button
                onClick={() => setIsPreviewMode(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/80 text-foreground hover:bg-accent hover:text-foreground transition-all"
                title="Cerrar Vista Previa"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="w-px h-6 bg-border mx-1 opacity-50"></div>

              <button
                onClick={handleExportToPDF}
                disabled={isExporting}
                className="px-6 py-3 bg-primary text-primary-foreground text-[10px] font-bold tracking-[0.2em] uppercase rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                Exportar PDF
              </button>
              <button
                onClick={handleExportToImage}
                disabled={isExporting}
                className="px-6 py-3 bg-foreground text-background text-[10px] font-bold tracking-[0.2em] uppercase rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                Exportar PNG
              </button>
            </div>
          )}
          {!isPreviewMode && (
            <aside className="w-full lg:w-64 bg-background rounded-xl shadow-lg lg:shadow-xl border border-border p-5 sm:p-6 flex flex-col gap-6 lg:gap-8 static lg:sticky top-36 z-30 shrink-0">
              <div className="pb-4 border-b border-border">
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-foreground">Sesión Activa</h3>
                <p className="text-[10px] text-muted-foreground mt-1">Herramientas globales de partitura.</p>
              </div>

              <div className="flex flex-col gap-6">
                {!isReadOnly && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase">Precio en Marketplace</label>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">€</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={songPrice > 0 ? songPrice : ""}
                        placeholder="0"
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          if (!val) { setSongPrice(0); return; }
                          // Limpiar leading zero solo si es numero entero, permitiendo escribir "0.5"
                          const parsed = val.length > 1 && val.startsWith('0') && !val.startsWith('0.') ? val.substring(1) : val;
                          setSongPrice(Number(parsed));
                        }}
                        className="flex-1 bg-transparent border-b border-gray-200 dark:border-gray-800 py-2 text-sm font-medium outline-none focus:border-primary text-foreground transition-colors"
                      />
                    </div>
                    <p className={`text-[9px] font-bold mt-1 ${songPrice > 0 ? "text-primary" : "text-gray-500 font-light"}`}>
                      {songPrice > 0 ? `Se publicará como Obra Premium por €${songPrice}.` : "Deja 0 para compartir libremente en la comunidad."}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase">Transpositor Inteligente</label>
                  <div className="flex bg-gray-50 dark:bg-[#1a1a1a] rounded border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <button onClick={() => handleTranspose(-1)} className="flex-1 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 border-r border-gray-200 dark:border-gray-800 transition-colors">-1</button>
                    <button onClick={() => handleTranspose(1)} className="flex-1 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">+1</button>
                  </div>
                  <p className="text-[9px] font-light text-gray-500 mt-1">Sube o baja medio tono todos los acordes al instante.</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase">Visor Inmersivo</label>
                  <button
                    onClick={() => setShow3DPiano(!show3DPiano)}
                    className={`py-3 px-4 rounded-lg flex items-center justify-between transition-colors shadow-sm text-xs font-bold uppercase tracking-widest border ${show3DPiano ? 'bg-primary text-primary-foreground border-transparent' : 'bg-transparent text-foreground border-gray-200 dark:border-gray-800 hover:border-primary/50'}`}
                  >
                    <span className="flex items-center gap-3">Mostrar Piano 3D</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${show3DPiano ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'}`}>{show3DPiano ? 'ACTIVO' : 'OFF'}</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase">Diseño de Página (Columnas)</label>
                  <div className="flex bg-gray-50 dark:bg-[#1a1a1a] rounded border border-gray-200 dark:border-gray-800 overflow-hidden">
                    {[0, 1, 2, 3].map((colVal) => (
                      <button
                        key={colVal}
                        onClick={() => setEditorColumns(colVal)}
                        className={`flex-1 py-3 text-xs font-bold transition-colors border-r last:border-r-0 border-gray-200 dark:border-gray-800
                        ${editorColumns === colVal
                            ? 'bg-primary text-primary-foreground'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                          }`}
                      >
                        {colVal === 0 ? 'AUTO' : colVal}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] font-light text-gray-500 mt-1">Ajuste local solo para esta sesión.</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase">Márgenes de Hoja</label>
                  <div className="flex bg-gray-50 dark:bg-[#1a1a1a] rounded border border-gray-200 dark:border-gray-800 overflow-hidden">
                    {[
                      { id: 'estrecho', label: 'Estrecho' },
                      { id: 'normal', label: 'Normal' },
                      { id: 'amplio', label: 'Amplio' }
                    ].map((marg) => (
                      <button
                        key={marg.id}
                        onClick={() => setEditorMargin(marg.id as any)}
                        className={`flex-1 py-3 text-xs font-bold transition-colors border-r last:border-r-0 border-gray-200 dark:border-gray-800
                        ${editorMargin === marg.id
                            ? 'bg-primary text-primary-foreground'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                          }`}
                      >
                        {marg.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] font-light text-gray-500 mt-1">Control de respiración del papel impreso/PDF.</p>
                </div>

                {notation === 'roman' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase">Tono Base (Romanos)</label>
                    <select
                      value={songKey} onChange={(e) => setSongKey(e.target.value)}
                      className="w-full bg-transparent border-b border-gray-200 dark:border-gray-800 py-2 text-sm text-gray-800 dark:text-white outline-none cursor-pointer"
                    >
                      {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                <Link href="/settings" className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary hover:text-black dark:hover:text-white transition-colors flex items-center justify-between group">
                  Abrir Preferencias
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </aside>
          )}

          {/* MOTOR DE PAGINACIÓN A4 Y SLIDER HORIZONTAL */}
          <div
            ref={pagesContainerRef}
            className={
              isPreviewMode
                ? "flex-1 w-full flex flex-col items-center overflow-y-auto py-12 px-2 sm:px-4 shadow-inner hide-scrollbar bg-muted gap-8 relative"
                : "flex gap-6 lg:gap-12 overflow-x-auto snap-x lg:snap-mandatory hide-scrollbar pb-12 w-full lg:pr-[50vw] relative"
            }
          >
            {/* BANNER DE PREVIEW DE PAGO */}
            {(song as any).isPreviewRestriction && (
              <div className="sticky left-1/2 -ml-[1px] md:absolute md:bottom-24 md:left-1/2 md:-translate-x-1/2 z-50 bg-background/95 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-primary/20 shadow-[0_30px_60px_-15px_rgba(var(--primary-raw),0.4)] text-center max-w-lg w-[90%] mt-8 mb-24 md:mt-0 md:mb-0 flex flex-col items-center animate-in slide-in-from-bottom-12 duration-1000 shrink-0 self-center">
                <span className="text-4xl mb-4 opacity-80">🔒</span>
                <h3 className="text-2xl font-black tracking-tight mb-2">Obra Premium</h3>
                <p className="text-muted-foreground text-sm mb-8 leading-relaxed">El creador ha protegido esta pieza. Adquiere los derechos de transcripción para ver todos los acordes, imprimir PDF y habilitar el Teleprompter.</p>

                <PurchaseButton songId={song.id} price={(song as any).price || 1.00} />
              </div>
            )}

            {song && paginateSong(song, baseLinesPerColumn, activeColumns).map((page, index) => (
              <div
                key={page.id}
                className={`a4-page bg-background text-foreground ${activeMarginClass} overflow-hidden relative lg:shadow-[0_30px_60px_-15px_rgba(var(--primary-raw),0.15)] transition-all duration-500 flex flex-col justify-start w-full lg:w-[210mm] lg:min-w-[210mm] h-[80vh] lg:h-[297mm] ring-0 lg:ring-1 lg:ring-border origin-top rounded-xl lg:rounded-none border border-border lg:border-none
                ${isPreviewMode ? 'transform shrink-0 scale-[0.6] sm:scale-75 lg:scale-[0.85] -mt-[40mm] sm:-mt-[20mm] lg:-mt-[10mm]' : 'shrink-0 lg:snap-center'}
              `}
              >
                {/* HEADER DE PAGINA CONDICIONAL */}
                {index === 0 ? (
                  hasMultipleSongs ? (
                    <div className="mb-6 shrink-0 border-b border-gray-200 dark:border-gray-800 pb-4">
                      <h1 className={`text-2xl sm:text-3xl font-serif font-black italic tracking-tight ${alignment === 'justify-center' ? 'text-center' : alignment === 'justify-end' ? 'text-right' : 'text-left'}`}>
                        {song.title}
                      </h1>
                    </div>
                  ) : (
                    <div className="mb-6 shrink-0">
                      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight break-words leading-[1.1] mb-4">
                        {song.title}
                      </h1>
                      <div className="flex items-center gap-6 md:gap-8 flex-wrap">
                        <span className="text-[10px] font-bold tracking-[0.4em] text-gray-400 uppercase flex items-center gap-2">
                          TEMPO —
                          {isReadOnly ? (
                            <span className="text-black dark:text-white">{song.bpm} BPM</span>
                          ) : (
                            <div className="flex items-center gap-1 group relative">
                              <input
                                type="number"
                                value={song.bpm || 120}
                                onChange={(e) => setSong({ ...(song as any), bpm: parseInt(e.target.value) || 0 })}
                                className="bg-transparent text-black dark:text-white font-bold outline-none w-10 text-center border-b border-transparent hover:border-gray-300 focus:border-primary transition-colors cursor-text"
                              />
                              <span className="text-black dark:text-white">BPM</span>
                            </div>
                          )}
                        </span>
                        <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1 min-w-[50px] max-w-[200px]"></div>

                        <div className="flex items-center gap-2">
                          {!isReadOnly ? (
                            <div className="flex items-center gap-2 text-yellow-500">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>
                              <span className="text-[10px] uppercase tracking-widest font-bold">
                                {Math.max((song as any).ratings?.length || 0, 0) > 0 ? (((song as any).ratings?.reduce((acc: number, r: any) => acc + r.value, 0) / (song as any).ratings?.length)).toFixed(1) : "0.0"} / 5.0
                              </span>
                            </div>
                          ) : (
                            <>
                              <StarRatingInteractive
                                songId={song.id}
                                myInitialRating={user ? ((song as any).ratings?.find((r: any) => r.userId === user?.id)?.value || 0) : 0}
                                readOnly={!user}
                              />
                              <span className="text-[10px] uppercase tracking-widest font-bold opacity-30">
                                {Math.max((song as any).ratings?.length || 0, 0) > 0 ? (((song as any).ratings?.reduce((acc: number, r: any) => acc + r.value, 0) / (song as any).ratings?.length)).toFixed(1) : "0.0"} / 5.0
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="mb-10 flex justify-between items-center opacity-40 border-b border-gray-200 dark:border-gray-800 pb-2 shrink-0">
                    <span className="text-[10px] uppercase font-bold tracking-widest">{song.title}</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest">Página {index + 1}</span>
                  </div>
                )}

                {/* CONTENIDO DE LA PÁGINA (COLUMNAS MASONRY DINÁMICAS) */}
                <div className={`grid grid-cols-1 ${({ 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' } as Record<number, string>)[page.columns.length] || 'md:grid-cols-1'} gap-8 sm:gap-12 w-full mt-2 flex-1 items-start mb-40 lg:mb-48`}>
                  {page.columns.map((col, colIdx) => (
                    <div key={`col-${page.id}-${colIdx}`} className="col-span-1 flex flex-col gap-10">
                      {col.map((section, sIdx) => (
                        <div
                          key={`${section.id}-${sIdx}`}
                          className={`flex flex-col gap-6 relative group break-inside-avoid ${!isReadOnly ? 'cursor-grab active:cursor-grabbing hover:bg-black/5 dark:hover:bg-white/5 rounded-xl p-2 -m-2 transition-all' : ''} ${draggedSectionId === section.id ? 'opacity-30' : ''} ${dragOverSectionId === section.id && dragOverDirection === 'top' ? 'border-t-2 border-t-primary !pt-4' : ''} ${dragOverSectionId === section.id && dragOverDirection === 'bottom' ? 'border-b-2 border-b-primary !pb-4' : ''}`}
                          draggable={!isReadOnly}
                          onDragStart={(e) => {
                            if (isReadOnly) return;
                            setDraggedSectionId(section.id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragOver={(e) => {
                            if (isReadOnly || !draggedSectionId || draggedSectionId === section.id) return;
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            
                            const rect = e.currentTarget.getBoundingClientRect();
                            const y = e.clientY - rect.top;
                            if (y < rect.height / 2) {
                               setDragOverDirection('top');
                            } else {
                               setDragOverDirection('bottom');
                            }
                            setDragOverSectionId(section.id);
                          }}
                          onDragLeave={(e) => {
                            if (dragOverSectionId === section.id) {
                                setDragOverSectionId(null);
                                setDragOverDirection(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOverSectionId(null);
                            setDragOverDirection(null);
                            if (isReadOnly || !draggedSectionId || draggedSectionId === section.id) return;

                            const currentSections = [...song.sections];
                            const fromIdx = currentSections.findIndex(s => s.id === draggedSectionId);
                            const toIdx = currentSections.findIndex(s => s.id === section.id);
                            if (fromIdx !== -1 && toIdx !== -1) {
                              const [removed] = currentSections.splice(fromIdx, 1);
                              const insertIdx = dragOverDirection === 'bottom' ? toIdx + 1 : toIdx;
                              currentSections.splice(insertIdx, 0, removed);
                              setSong({ ...song, sections: currentSections });
                            }
                            setDraggedSectionId(null);
                          }}
                          onDragEnd={() => {
                            setDraggedSectionId(null);
                            setDragOverSectionId(null);
                            setDragOverDirection(null);
                          }}
                        >

                          {/* Título de la sección si existe y NO es continuación */}
                          {section.title && !section.isContinuation && (
                            /^(?:[IVX]+\.|\d+\.)/i.test(section.title) ? (
                              // DEVOTIONAL SONG HEADER (e.g. "I.", "1. Te Adoramos")
                              <div className="w-full mt-2 mb-2">
                                <h2 className={`text-lg sm:text-xl font-serif font-black italic tracking-wide opacity-90 ${alignment === 'justify-center' ? 'text-center' : alignment === 'justify-end' ? 'text-right' : 'text-left'}`}>
                                  {section.title}
                                </h2>
                              </div>
                            ) : (
                              // NORMAL SECTION TITLE
                              <h2 className={`text-xl sm:text-2xl font-sans font-black italic tracking-tight mb-0 opacity-90 ${alignment === 'justify-center' ? 'text-center' : alignment === 'justify-end' ? 'text-right' : 'text-left'}`}>
                                {section.title}
                              </h2>
                            )
                          )}

                          {/* Minimalist Section Label con Repetidor Numérico - Sólo si empieza aquí */}
                          {!section.isContinuation && (
                            <div className="flex items-center gap-6 group/secHeader w-full">
                              <span className="text-[10px] font-bold tracking-[0.4em] text-gray-400 uppercase flex items-center gap-3 shrink-0">
                                <select
                                  value={section.type}
                                  onChange={(e) => handleSectionTypeChange(section.id, e.target.value)}
                                  className="bg-transparent border-none appearance-none outline-none font-bold tracking-[0.4em] uppercase text-gray-400 cursor-pointer hover:text-primary transition-colors focus:outline-none focus:ring-0 max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                                  title="Cambiar tipo de sección"
                                >
                                  {![
                                    'Estrofa', 'Coro', 'Pre-Coro', 'Puente', 'Intro', 'Final', 'Instrumental', 'Interludio'
                                  ].includes(section.type) && (
                                      <option value={section.type} className="text-foreground bg-background">{section.type}</option>
                                    )}
                                  {['Estrofa', 'Coro', 'Pre-Coro', 'Puente', 'Intro', 'Final', 'Instrumental', 'Interludio'].map(type => (
                                    <option key={type} value={type} className="text-foreground bg-background">{type}</option>
                                  ))}
                                </select>

                                <span
                                  onClick={() => handleSectionRepeatChange(section.id)}
                                  className="text-gray-200 dark:text-gray-700 cursor-pointer hover:text-primary transition-colors hover:scale-110 active:scale-95"
                                  title="Cambiar repeticiones"
                                >
                                  x{section.repeat || 1}
                                </span>
                              </span>

                              <div className="h-px bg-gray-100 dark:bg-gray-800 flex-1 opacity-20 group-hover/secHeader:opacity-100 transition-opacity"></div>

                              {/* Auto-rellenar acordes lógico */}
                              {(() => {
                                const hasChords = section.lines.some(l => l.words.some(w => w.syllables.some(s => s.chord !== null)));
                                const globalSecIdx = song.sections.findIndex(s => s.id === section.id);
                                // Only show if this section has NO chords, and is NOT the first section ever
                                if (!hasChords && globalSecIdx > 0 && !isReadOnly) {
                                  return (
                                    <button
                                      onClick={() => handleAutoFillChords(section.id)}
                                      className="opacity-0 group-hover/secHeader:opacity-100 transition-opacity px-3 py-1 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-[8px] sm:text-[9px] font-bold tracking-widest uppercase rounded flex items-center gap-2 shrink-0 border border-primary/20 hover:border-primary active:scale-95"
                                      title="Copiar acordes de la estrofa anterior idéntica"
                                    >
                                      <span className="text-[12px] leading-none">✨</span> Auto-Completar Acordes
                                    </button>
                                  );
                                }
                                return null;
                              })()}

                              {!isReadOnly && (
                                <div className="flex items-center gap-1 opacity-0 group-hover/secHeader:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleDuplicateSection(section.id)}
                                    className="text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 p-1.5 rounded active:scale-95 transition-all"
                                    title="Duplicar esta estrofa"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSection(section.id)}
                                    className="text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 p-1.5 rounded active:scale-95 transition-all"
                                    title="Eliminar esta estrofa"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex flex-col gap-3 sm:gap-4 mt-1">
                            {section.lines.map((line) => {
                              const playingStyle = activeLineId === line.id
                                ? 'opacity-100 scale-[1.02] transform origin-left ml-4 text-primary'
                                : isPlaying
                                  ? 'opacity-30 blur-[1px]'
                                  : 'opacity-100';

                              return (
                                <div
                                  key={line.id}
                                  id={line.id}
                                  className={`flex flex-wrap items-end ${alignment} transition-all duration-700 ease-in-out relative group/line ${playingStyle} ${fontFamily} ${fontSize} ${lineHeight} shrink-0`}
                                >

                                  {line.words.map((word, wIdx) => (
                                    <div key={word.id} className="flex flex-wrap mr-3 sm:mr-4 group/word">
                                      {word.syllables.map((syl, i) => (
                                        <SyllableComponent
                                          key={syl.id}
                                          syllable={syl}
                                          notation={notation}
                                          songKey={songKey}
                                          nextHasChord={Boolean(
                                            // Look ahead for next syllable in same word, OR first syllable of next word
                                            word.syllables[i + 1]?.chord ||
                                            (!word.syllables[i + 1] && line.words[wIdx + 1]?.syllables[0]?.chord)
                                          )}
                                          onChordChange={handleChordChange}
                                          readOnly={isReadOnly}
                                        />
                                      ))}
                                    </div>
                                  ))}

                                  {!isReadOnly && (
                                    <div className="flex items-center gap-3 ml-2 opacity-0 group-hover/line:opacity-100 transition-opacity duration-300 shrink-0 self-center">
                                      <button
                                        onClick={() => handleAddTrailingChord(section.id, line.id)}
                                        className="text-[9px] font-bold text-primary-foreground bg-primary border border-transparent rounded px-3 py-1.5 tracking-widest hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-md uppercase whitespace-nowrap"
                                      >
                                        + Acorde
                                      </button>
                                      <span
                                        onClick={() => handleLineRepeatChange(section.id, line.id)}
                                        className="text-[10px] font-bold tracking-wider text-gray-200 dark:text-gray-700 cursor-pointer hover:text-primary transition-colors border border-transparent hover:border-primary rounded px-2"
                                        title="Repeticiones de la línea"
                                      >
                                        x{line.repeat || 1}
                                      </span>
                                    </div>
                                  )}

                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* FOOTER POR PÁGINA (Flujo seguro en la parte inferior) */}
                <div className="mt-auto w-full relative h-[5rem] lg:h-[6rem] bg-background flex flex-col justify-end px-8 sm:px-12 lg:px-16 pb-6 sm:pb-8 lg:pb-12 text-muted-foreground/60 shrink-0 break-inside-avoid">
                  <div className="w-auto absolute top-0 left-8 right-8 sm:left-12 sm:right-12 lg:left-16 lg:right-16 h-px bg-border/30"></div>
                  <div className="flex justify-between items-end w-full">
                    <p className="text-[8px] font-bold tracking-[0.2em] uppercase">
                      Aura <span className="font-black inline-block px-1 text-primary">Chords</span>
                    </p>
                    <p className="text-[8px] font-bold tracking-[0.2em] uppercase">
                      {new Date().getFullYear()} - PÁG {index + 1}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* DICCIONARIO DE ACORDES (Página final exportable) */}
            {includeChordsDictionary && uniqueChords.length > 0 && (
              <div className={`a4-page relative w-[794px] h-[1123px] shrink-0 shadow-2xl overflow-hidden flex flex-col bg-background ${fontFamily}`} style={{ pageBreakAfter: 'always' }}>
                <div className="pt-24 px-16 pb-12 flex-1 flex flex-col items-center text-center">
                  <h2 className="text-3xl font-black tracking-[0.2em] text-primary mb-16 uppercase text-center w-full border-b border-border pb-6 drop-shadow-sm">Diccionario de Acordes</h2>
                  <div className="grid grid-cols-4 gap-y-16 gap-x-8 w-full place-items-center">
                     {uniqueChords.map((chord, idx) => {
                       const formatted = formatChordText(chord, notation, songKey);
                       return (
                         <div key={idx} className="flex flex-col items-center gap-5 w-full">
                             <div className="text-[26px] font-black font-sans text-foreground flex items-end tracking-tight">
                                 {formatted.root}
                                 {formatted.variation && <span className="text-[14px] font-bold relative -top-2 ml-0.5">{formatted.variation}</span>}
                                 {formatted.bass && <span className="text-[16px] ml-1 opacity-70">/{formatted.bass}</span>}
                             </div>
                             <MiniPiano2D chord={chord} themeColor={colorTheme} className="w-[124px] shadow-sm rounded-sm" />
                         </div>
                       );
                     })}
                  </div>
                </div>
                
                {/* FOOTER POR PÁGINA (Flujo seguro en la parte inferior) */}
                <div className="mt-auto w-full relative h-[5rem] lg:h-[6rem] bg-background flex flex-col justify-end px-8 sm:px-12 lg:px-16 pb-6 sm:pb-8 lg:pb-12 text-muted-foreground/60 shrink-0 break-inside-avoid">
                  <div className="w-auto absolute top-0 left-8 right-8 sm:left-12 sm:right-12 lg:left-16 lg:right-16 h-px bg-border/30"></div>
                  <div className="flex justify-between items-end w-full">
                    <p className="text-[8px] font-bold tracking-[0.2em] uppercase">
                      Aura <span className="font-black inline-block px-1 text-primary">Chords</span>
                    </p>
                    <p className="text-[8px] font-bold tracking-[0.2em] uppercase">
                      {new Date().getFullYear()} - PÁG {song ? paginateSong(song, baseLinesPerColumn, activeColumns).length + 1 : 2}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SPACER FANTASMA PARA TELEPROMPTER A NIVEL DE LOS OJOS */}
            {isPlaying && !isReadOnly && (
              <div className="h-[50vh] w-full shrink-0 flex items-center justify-center opacity-30 mt-10 animate-in fade-in duration-1000">
                <div className="w-full max-w-sm border-t border-dashed border-border relative">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    Fin de la Pista
                  </span>
                </div>
              </div>
            )}
            
          </div>
        </div>
        {/* HUD PIANO 3D FLOTANTE */}
        {
          show3DPiano && (
            <div className="fixed bottom-0 left-0 lg:bottom-6 lg:left-auto lg:right-6 lg:-translate-x-0 w-full lg:w-[500px] h-[30vh] lg:h-[30vh] bg-[#050505]/90 backdrop-blur-2xl border border-[#ffffff20] rounded-t-3xl lg:rounded-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.8)] lg:shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[110] overflow-hidden flex flex-col group animate-in slide-in-from-bottom-12 duration-500 ease-out">
              <div className="absolute top-4 right-4 z-20 flex items-center gap-4">
                {active3DChord ? (
                  <span className="text-xl font-black tracking-tighter text-primary drop-shadow">
                    {formatChordText(active3DChord, notation, songKey).root}
                    <span className="text-sm font-sans">{formatChordText(active3DChord, notation, songKey).variation}</span>
                  </span>
                ) : (
                  <span className="text-[9px] font-bold tracking-[0.2em] text-gray-500/50 uppercase">Esperando Acorde...</span>
                )}
                <button
                  onClick={() => setShow3DPiano(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white flex items-center justify-center text-white hover:text-black transition-all backdrop-blur-md"
                  title="Cerrar Motor 3D"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex-1 w-full h-full relative cursor-move">
                <Piano3D
                  activeKeys={active3DChord ? getChordKeys(active3DChord.rootNote, active3DChord.variation, active3DChord.bassNote) : []}
                  themeColor={colorTheme}
                />
              </div>
            </div>
          )}

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

      {isExportModalOpen && (
        <ExportModal
          song={song}
          colorTheme={colorTheme}
          onClose={() => setIsExportModalOpen(false)}
          onExportPDF={handleExportToPDF}
          onExportPNG={handleExportToImage}
        />
      )}

      {/* MODAL OFFLINE PROFESIONAL */}
      {offlineModalMsg && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOfflineModalMsg(null)}></div>
          <div className="relative bg-background border border-border shadow-2xl rounded-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 fade-in duration-300">
            <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-3 text-foreground">{offlineModalMsg.title}</h3>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              {offlineModalMsg.message}
            </p>
            <button 
              onClick={() => setOfflineModalMsg(null)}
              className="w-full py-4 bg-primary text-primary-foreground font-bold text-[10px] tracking-[0.2em] uppercase rounded-full hover:opacity-90 transition-opacity active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </>
  );
}
