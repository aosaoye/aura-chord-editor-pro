"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { toPng } from "html-to-image";
import SyllableComponent from "../components/SyllableComponent";
import MiniPiano2D from '../components/MiniPiano2D';
import MiniGuitar2D from '../components/MiniGuitar2D';
import LiveGuitarFretboard from '../components/LiveGuitarFretboard';
import { Song, Chord, Word, Syllable } from "../config/config";
import { parseTextToSong } from "../config/parseTextToSong";
import { jsPDF } from "jspdf";
import { transposeSong, transposeChord } from "../helpers/transpose";
import { NotationType, formatChordText } from "../helpers/chordFormatter";
import { paginateSong } from "../helpers/pagination";
import { useGlobalSettings } from "../context/SettingsContext";
import { useTeleprompter } from "../hooks/useTeleprompter";
import { getChordKeys } from "../helpers/chordToPianoKeys";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import PurchaseButton from "../components/PurchaseButton";
import StarRatingInteractive from "../components/StarRatingInteractive";
import GsapWrapper from "../components/GsapWrapper";
import dynamic from 'next/dynamic';
import ExportModal from "../components/ExportModal";
import EditorSettingsSidebar from "../components/EditorSettingsSidebar";
import { offlineStorage } from "../utils/offlineStorage";
import { useTuner } from "../hooks/useTuner";
import { Mic, MicOff, Smartphone, Eye, Play } from "lucide-react";

const Piano3D = dynamic(() => import('../components/Piano3D'), {
  ssr: false, 
  loading: () => <div className="h-64 w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Cargando motor 3D...</div>
});
const GuitarTuner = dynamic(() => import('../components/GuitarTuner'), { ssr: false });

export default function SongEditor() {
  const t = useTranslations('editor_nav');
  const tNav = useTranslations('nav');
  const searchParams = useSearchParams();
  const [song, setSong] = useState<Song | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { user } = useUser();

  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);
  const [dragOverDirection, setDragOverDirection] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null);
  const [includeChordsDictionary, setIncludeChordsDictionary] = useState(true);

  // States for inline lyric editing
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editingLineText, setEditingLineText] = useState<string>("");

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
  const [active3DChord, setActive3DChord] = useState<Chord | null>(null);

  const hasMultipleSongs = Array.isArray(song?.sections) && song.sections.filter(s => s.title && /^\d+\.\s/.test(s.title)).length > 1;
  const activeColumns = editorColumns > 0 ? editorColumns : (song?.layout?.columns || (hasMultipleSongs ? 2 : 1));
  
  const layout = {
    columns: activeColumns as 1|2|3|4,
    baseFontSize: fontSize.includes('2xl') ? 24 : fontSize.includes('xl') ? 20 : fontSize.includes('sm') ? 14 : 16,
    chordFontSize: 14,
    lineHeight: lineHeight.includes('loose') ? 2.5 : lineHeight.includes('tight') ? 1.5 : 2,
    fontFamily: (fontFamily.includes('serif') ? 'serif' : fontFamily.includes('mono') ? 'mono' : 'sans') as 'sans' | 'serif' | 'mono',
    alignment: alignment || 'justify-start',
    notation: notation || 'english',
    showChords: true,
    capo: 0,
    instrument: 'piano' as 'piano' | 'guitar',
    pageSize: 'A4' as 'A4' | 'CARTA',
    orientation: 'portrait' as 'portrait' | 'landscape',
    margin: 'normal' as 'estrecho' | 'normal' | 'amplio',
    footerStyle: 'simple' as 'none' | 'simple' | 'bandas',
    ...(song?.layout || {})
  };

  const updateLayout = useCallback((updates: Partial<typeof layout>) => {
    if (!song) return;
    setSong(prev => prev ? { ...prev, layout: { ...layout, ...updates } } as any : prev);
  }, [layout, song, setSong]);

  const handleGlobalChordChange = useCallback((oldChord: Chord, newChord: Chord | null) => {
    if (!song) return;
    setSong(prev => {
      if (!prev) return prev;
      const updatedSections = prev.sections.map(sec => ({
        ...sec,
        lines: sec.lines.map(line => ({
          ...line,
          words: line.words.map(w => ({
            ...w,
            syllables: w.syllables.map(s => {
               if (s.chord && s.chord.rootNote === oldChord.rootNote && (s.chord.variation || "") === (oldChord.variation || "") && (s.chord.bassNote || "") === (oldChord.bassNote || "")) {
                  return { ...s, chord: newChord ? { ...newChord, id: `chord-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` } : null };
               }
               return s;
            })
          }))
        }))
      }));
      return { ...prev, sections: updatedSections };
    });
  }, [song, setSong]);

  // Cada línea tiene su propia font-size, además de un interlineado adaptable en el gap.
  // Calculamos la altura real para que pagination reparta equitativamente sin desbordar la página A4.
  const actualTextHeight = (layout.baseFontSize || 16) * 1.25;
  const actualGap = Math.max(0.25, (layout.lineHeight || 1.5) - 1) * 16;
  const textLineHeight = actualTextHeight + actualGap;
  
  // Calculate dynamic dimensions for safe-zones
  const isLetter = layout?.pageSize === 'CARTA';
  const isLand = layout?.orientation === 'landscape';
  const rawPageHeight = isLand ? (isLetter ? 816 : 794) : (isLetter ? 1056 : 1123);
  const marginOffsets = { estrecho: 180, normal: 260, amplio: 320 };
  const offset = marginOffsets[(layout?.margin as keyof typeof marginOffsets) || 'normal'];
  const baseLinesPerColumn = Math.floor((rawPageHeight - offset) / textLineHeight);

  // Hook del Teleprompter
  const { isPlaying, activeLineId, activeSyllableId, activeChord, togglePlay } = useTeleprompter(song);

  // Hook del Tuner para Aura Voice
  const [isAuraVoiceActive, setIsAuraVoiceActive] = useState(false);
  const { startTuning, stopTuning, closestString, cents, pitch, isListening } = useTuner('chromatic');
  const lastProcessedSyllable = useRef<string | null>(null);

  useEffect(() => {
    if (isAuraVoiceActive) {
      startTuning();
    } else {
      stopTuning();
      lastProcessedSyllable.current = null;
    }
  }, [isAuraVoiceActive, startTuning, stopTuning]);

  // Escuchar cuando se hace clic en un acorde (manual) para mostrarlo en el 3D
  useEffect(() => {
    const handlePickerOpened = (e: CustomEvent) => {
      const detailChord = e.detail?.chord;
      if (detailChord) {
        setActive3DChord(detailChord);
      }
    };

    const handlePianoPlay = (e: CustomEvent) => {
      setActive3DChord(e.detail);
    };

    window.addEventListener('chord-picker-opened', handlePickerOpened as EventListener);
    window.addEventListener('piano-play-chord', handlePianoPlay as EventListener);
    return () => {
      window.removeEventListener('chord-picker-opened', handlePianoPlay as EventListener);
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
        // En Modo Presentación, cuando una línea es MUY LARGA y hace wrap en múltiples líneas,
        // su centro geométrico baja. Si usamos block: 'center', el bloque entero se centra, empujando
        // la primera línea (y sus acordes) hacia el techo de la pantalla.
        // Solución: Anclar siempre la PARTE SUPERIOR del elemento a un porcentaje fijo (ej. 40%) de la pantalla.
        setTimeout(() => {
          const container = presentElement.closest('.overflow-y-auto') as HTMLElement;
          if (container) {
            // Alinea el 'top' del elemento activo exactamente al 40% de la pantalla
            const offsetFromTop = container.clientHeight * 0.4;
            const targetScroll = presentElement.offsetTop - offsetFromTop;
            
            container.scrollTo({
              top: targetScroll,
              behavior: 'smooth'
            });
          } else {
            presentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
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

    const id = searchParams.get('id');
    const isNew = searchParams.get('new');

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

    if (id) {
      setIsAnimating(true);
      fetch(`/api/songs?id=${id}`)
        .then(res => {
          if (!res.ok) throw new Error("Fallo de red");
          return res.json();
        })
        .then(data => {
          if (data.songs && data.songs.length > 0) {
            const found = data.songs.find((s: any) => s.id === id) || data.songs[0];
            if (found && found.parsedData) {
              try {
                const loadedSong = typeof found.parsedData === 'string' ? JSON.parse(found.parsedData) : found.parsedData;
                loadedSong.id = found.id;
                loadedSong.userId = found.userId;
                loadedSong.authorName = found.user?.name;
                setSong(loadedSong);
                
                // 🚀 SENIOR FIX: Al cargar online, guardamos una copia offline
                offlineStorage.saveSong(loadedSong).catch(console.error);
                
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
                 const offlineSong = await offlineStorage.getSong(id);
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
    } else {
      // 🚀 RESTORE DRAFTS IF ID == NULL AND NOT NEW
      if (draftLyrics && draftTitle) {
      setTitleInput(draftTitle);
      setLyricsInput(draftLyrics);

      // Limpiamos Search Redirects
      localStorage.removeItem("chordpro-draft-lyrics");
      localStorage.removeItem("chordpro-draft-title");

      // NOTA SENIOR: Ya no procesamos la canción de forma automática.
      // El usuario solicitó detenerse obligatoriamente en el "Editor de Letra" (Importador)
      // para poder separar estrofas de la letra exportada desde Search antes de generar los acordes.
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
    }
  }, [searchParams]);

  // Guardado en caliente (Hot Save) cada vez que se modifique un acorde o algo en el Editor
  useEffect(() => {
    if (song) {
      localStorage.setItem("chordpro-draft-song", JSON.stringify(song));
    }
  }, [song]);


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

  // Function to edit lyrics inline
  const handleSaveLineEdit = useCallback((sectionId: string, lineId: string) => {
    if (!editingLineText.trim()) {
      setEditingLineId(null);
      return; 
    }
    setSong(currentSong => {
      if (!currentSong) return currentSong;
      const newSections = currentSong.sections.map(section => {
        if (section.id !== sectionId) return section;
        const newLines = section.lines.map(line => {
          if (line.id !== lineId) return line;
          
          const wordsText = editingLineText.trim().split(/\s+/).filter(Boolean);
          const mockSilabear = (word: string) => {
              if (!word) return [];
              const silabas = word.match(/[^aeiouáéíóúü]*[aeiouáéíóúü]+(?:[^aeiouáéíóúü]*$|[^aeiouáéíóúü](?=[^aeiouáéíóúü]))?/gi);
              return silabas || [word];
          };

          const newWords: Word[] = wordsText.map(wordStr => {
             const syllablesText = mockSilabear(wordStr);
             const syllables: Syllable[] = syllablesText.map(sylStr => ({
                id: `syl-${Date.now().toString(36)}-${Math.random().toString(36).substring(2,6)}`,
                text: sylStr,
                chord: null
             }));
             return {
                id: `word-${Date.now().toString(36)}-${Math.random().toString(36).substring(2,6)}`,
                syllables
             };
          });

          // Recover sequential chords and reassign them
          const oldChords = line.words.flatMap(w => w.syllables).map(s => s.chord).filter(c => c !== null);
          const newSyllables = newWords.flatMap(w => w.syllables);
          for (let i = 0; i < Math.min(oldChords.length, newSyllables.length); i++) {
             newSyllables[i].chord = oldChords[i];
          }

          return { ...line, words: newWords };
        });
        return { ...section, lines: newLines };
      });
      return { ...currentSong, sections: newSections };
    });
    setEditingLineId(null);
    setEditingLineText("");
  }, [editingLineText]);

  // Cambiar Acorde Específico
  const handleChordChange = useCallback((syllableId: string, newChord: Chord | null, styleOptions?: { highlightColor?: string, casing?: string }) => {
    setSong((currentSong) => {
      if (!currentSong) return currentSong;
      const updatedSections = currentSong.sections.map((section) => ({
        ...section,
        lines: section.lines.map((line) => ({
          ...line,
          words: line.words.map((word) => ({
            ...word,
            syllables: word.syllables.map((syl) => {
              if (syl.id === syllableId) {
                const updatedSyl: any = { ...syl, chord: newChord };
                if (styleOptions) {
                  if (styleOptions.highlightColor !== undefined) updatedSyl.highlightColor = styleOptions.highlightColor;
                  if (styleOptions.casing !== undefined) updatedSyl.casing = styleOptions.casing;
                }
                return updatedSyl;
              }
              return syl;
            }),
          })),
        })),
      }));
      return { ...currentSong, sections: updatedSections };
    });
  }, []);

  // Herramienta matemática para ajustar la voz desviada a la escala de la canción
  const getClosestDiatonicNote = useCallback((note: string, key: string): string => {
    const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
    
    const keyMatch = key.match(/^[A-G]#?/);
    if (!keyMatch) return note;
    
    const baseKey = keyMatch[0];
    let keyIndex = CHROMATIC_SCALE.indexOf(baseKey);
    if (keyIndex === -1) return note;

    let scaleIndices = MAJOR_SCALE_INTERVALS.map(interval => (keyIndex + interval) % 12);
    if (key.endsWith('m')) {
      const relMajorIdx = (keyIndex + 3) % 12; // Menor a Mayor (+3 semitonos)
      scaleIndices = MAJOR_SCALE_INTERVALS.map(interval => (relMajorIdx + interval) % 12);
    }

    const noteIndex = CHROMATIC_SCALE.indexOf(note);
    if (noteIndex === -1) return note;

    if (scaleIndices.includes(noteIndex)) return note;

    let minDiff = 12;
    let closestIndex = noteIndex;

    for (const idx of scaleIndices) {
      const dist1 = Math.abs(idx - noteIndex);
      const dist2 = 12 - dist1;
      const dist = Math.min(dist1, dist2);
      if (dist < minDiff) { 
        minDiff = dist; 
        closestIndex = idx; 
      }
    }

    return CHROMATIC_SCALE[closestIndex];
  }, []);

  // Efecto acoplado debajo de handleChordChange para funcionar con el Afinador (Aura Voice)
  useEffect(() => {
    if (!isAuraVoiceActive || !isPlaying || !activeSyllableId) return;
    
    if (lastProcessedSyllable.current !== activeSyllableId) {
       // Aumentamos la tolerancia para voz a +/- 35 cents porque la voz humana fluctúa más que un instrumento
       if (pitch > 0 && closestString && Math.abs(cents) <= 35) {
          const rootNoteMatch = closestString.note.match(/^[A-G]#?/);
          if (rootNoteMatch) {
             const rawNote = rootNoteMatch[0];
             // Auto-tune de Aura Voice: Corrector de Desviación de Tono
             const rootNote = getClosestDiatonicNote(rawNote, songKey);
             
             // Si el modo menor termina asignando un relativo menor, intentamos dar la variación "m", o lo dejamos neutro.
             let variation = "";
             if (songKey.endsWith('m')) {
                // Heurística simple: si la nota coincide con la tónica, es menor.
                if (rootNote === songKey.replace('m', '')) variation = "m";
             }
             
             const newChord: Chord = {
                id: `chord-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                rootNote: rootNote,
                variation: variation 
             };
             
             // Desacoplamos un ciclo para no bloquear el motor principal
             requestAnimationFrame(() => {
                handleChordChange(activeSyllableId, newChord);
                showToast(`Aura Corrigió Tono: ${rawNote} ➔ ${rootNote}${variation}`);
             });
             lastProcessedSyllable.current = activeSyllableId;
          }
       }
    }
  }, [pitch, closestString, cents, activeSyllableId, isAuraVoiceActive, isPlaying, handleChordChange, getClosestDiatonicNote, songKey]);

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

  const handleRemoveSectionChords = useCallback((sectionId: string) => {
    setSong((currentSong) => {
      if (!currentSong) return currentSong;
      const updatedSections = currentSong.sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            lines: section.lines.map(line => ({
              ...line,
              words: line.words.map(word => ({
                ...word,
                syllables: word.syllables.map(syl => ({ ...syl, chord: null, highlightColor: undefined }))
              }))
            }))
          };
        }
        return section;
      });
      return { ...currentSong, sections: updatedSections };
    });
  }, []);

  const handleRemoveLineChords = useCallback((sectionId: string, lineId: string) => {
    setSong((currentSong) => {
      if (!currentSong) return currentSong;
      const updatedSections = currentSong.sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            lines: section.lines.map(line => {
              if (line.id === lineId) {
                return {
                  ...line,
                  words: line.words.map(word => ({
                    ...word,
                    syllables: word.syllables.map(syl => ({ ...syl, chord: null, highlightColor: undefined }))
                  }))
                };
              }
              return line;
            })
          };
        }
        return section;
      });
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

  const handleMergeWithNext = useCallback((sectionId: string) => {
    setSong((currentSong) => {
      if (!currentSong) return currentSong;
      const index = currentSong.sections.findIndex(s => s.id === sectionId);
      if (index === -1 || index >= currentSong.sections.length - 1) return currentSong;

      const newSections = [...currentSong.sections];
      const currentSection = currentSong.sections[index];
      const nextSection = currentSong.sections[index + 1];

      // Create a brand new merged section to trigger React re-render properly
      const mergedSection = {
        ...currentSection,
        lines: [...currentSection.lines, ...nextSection.lines],
      };

      // Replace the current section with the merged one
      newSections[index] = mergedSection;
      
      // Remove next section
      newSections.splice(index + 1, 1);
      
      return { ...currentSong, sections: newSections };
    });
  }, []);

  const handleSplitSection = useCallback((sectionId: string, lineId: string) => {
    setSong((currentSong) => {
      if (!currentSong) return currentSong;
      const index = currentSong.sections.findIndex(s => s.id === sectionId);
      if (index === -1) return currentSong;

      const currentSection = currentSong.sections[index];
      const lineIndex = currentSection.lines.findIndex(l => l.id === lineId);
      
      // If the line is the first one, splitting doesn't make sense 
      if (lineIndex <= 0) return currentSong;

      const newSections = [...currentSong.sections];
      
      // The current section will keep lines before the split
      const updatedCurrentSection = { 
        ...currentSection, 
        lines: currentSection.lines.slice(0, lineIndex) 
      };
      
      // The new section will get lines from the split onwards
      const newSection = {
        ...currentSection,
        id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: '', // Typically the new separated part doesn't inherit the explicit title immediately
        isContinuation: true, // Mark it as a continuation visually
        lines: currentSection.lines.slice(lineIndex)
      };

      newSections.splice(index, 1, updatedCurrentSection, newSection);
      
      return { ...currentSong, sections: newSections };
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

    if (song.isPreviewRestriction) {
      showToast("🔒 Debes adquirir esta obra Premium para habilitar la descarga en imagen.");
      return;
    }

    try {
      setIsExporting(true);
      await new Promise(resolve => setTimeout(resolve, 150));

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

    if (song.isPreviewRestriction) {
      showToast("🔒 Debes adquirir esta obra Premium para habilitar la descarga en PDF.");
      return;
    }

    try {
      setIsExporting(true);
      await new Promise(resolve => setTimeout(resolve, 150));

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
        body: JSON.stringify({ song })
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
  }, [song]);

  const mobileBlocker = (
    <div className="flex md:hidden min-h-screen bg-background text-foreground flex-col items-center justify-center p-8 text-center pb-32 anim-in fade-in duration-500">
      <Smartphone size={80} strokeWidth={1} className="mb-10 text-primary opacity-80 drop-shadow-2xl" />
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
        <div className={`hidden lg:block min-h-[100svh] bg-background text-foreground transition-all duration-700 ease-in-out ${isAnimating ? 'opacity-0' : 'opacity-100'} ${colorTheme}`}>
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
                  {t('generate_canvas')}
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

  const marginMap = {
    'estrecho': 'px-4 pt-4 pb-[5rem] sm:px-6 sm:pt-6 lg:px-8 lg:pt-8 lg:pb-[6rem]',
    'normal': 'px-6 pt-6 pb-[6rem] sm:px-10 sm:pt-10 lg:px-16 lg:pt-16 lg:pb-[8rem]',
    'amplio': 'px-10 pt-10 pb-[8rem] sm:px-14 sm:pt-14 lg:px-24 lg:pt-24 lg:pb-[10rem]'
  };
  const activeMarginClass = marginMap[(layout?.margin as keyof typeof marginMap) || 'normal'];

  return (
    <>
      {!isReadOnly && mobileBlocker}
      <div className={`${!isReadOnly ? 'hidden md:flex' : 'flex'} w-full min-h-[100svh] flex-col bg-background text-foreground transition-colors duration-500 overflow-hidden font-sans selection:bg-primary selection:text-foreground ${colorTheme} ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>

        <Navbar
          variant="editor"
          className={`z-50 ${isPreviewMode ? 'hidden' : ''}`}
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
              <Link href="/" className="cursor-pointer hover:text-foreground transition-colors">{tNav('home')}</Link>
              <Link href="/settings" className="cursor-pointer hover:text-foreground transition-colors">{tNav('tools') || 'Configuración'}</Link>
              <span className="cursor-pointer text-primary border-b-2 border-primary pb-1">{t('studio')}</span>
            </div>
          }
          rightContent={
            <div className="flex items-center gap-2 lg:gap-4 w-full lg:w-auto overflow-x-auto hide-scrollbar mt-4 lg:mt-0 pb-1 lg:pb-0">
              <button
                onClick={() => {
                  if (isAuraVoiceActive) {
                    setIsAuraVoiceActive(false);
                    stopTuning();
                  } else {
                    setIsAuraVoiceActive(true);
                    startTuning();
                  }
                }}
                className={`text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-3 rounded-full shrink-0 flex items-center gap-2 transition-all ${isAuraVoiceActive ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary-raw),0.5)] animate-pulse' : 'text-foreground border border-transparent hover:border-border hover:bg-accent'}`}
                title="Dictado por Voz / Instrumento"
              >
                {isAuraVoiceActive ? <Mic size={14} /> : <MicOff size={14} className="opacity-50" />} {isAuraVoiceActive ? t('voice_on') : t('voice_off')}
              </button>

              <Link
                href="/herramientas/afinador"
                target="_blank"
                className="text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-3 rounded-full text-foreground border border-transparent hover:border-border hover:bg-accent transition-colors shrink-0 flex items-center gap-2"
                title={t('tuner')}
              >
                <Mic size={14} /> {t('tuner')}
              </Link>

              <button
                onClick={() => setIsPreviewMode(true)}
                className="text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-3 rounded-full bg-accent text-foreground hover:bg-primary hover:text-primary-foreground transition-colors shrink-0 flex items-center gap-2"
              >
                <Eye size={14} /> {t('preview')}
              </button>
              <button
                onClick={togglePlay}
                className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase px-6 sm:px-8 py-3 rounded-full bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all shadow-xl shrink-0 flex items-center gap-2"
              >
                <Play size={14} fill="currentColor" /> {t('play')}
              </button>

              <div className="h-4 w-px bg-border hidden sm:block shrink-0"></div>

              {/* Grupo de Exportación */}
              <div className="flex items-center bg-foreground rounded-full overflow-hidden transition-transform active:scale-95 shrink-0">
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-6 py-3 bg-foreground text-background text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 border-r border-background/20 flex items-center gap-2 shrink-0"
                >
                  Exportar Pro
                </button>

                {!isReadOnly && (
                  <button
                    onClick={handleSaveSong}
                    disabled={isSaving || isExporting}
                    className="px-6 py-3 bg-primary text-primary-foreground text-[10px] font-bold tracking-[0.2em] uppercase hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center min-w-[140px] whitespace-nowrap shrink-0"
                  >
                    {isSaving ? (
                      <span className="animate-pulse">Guardando...</span>
                    ) : (
                      'Guardar'
                    )}
                  </button>
                )}
              </div>
              
              {/* Spacer para que en móviles no se pegue al borde derecho al hacer scroll */}
              <div className="w-2 lg:hidden shrink-0"></div>
            </div>
          }
        />

        <div className={isPreviewMode ? "flex h-screen w-full bg-muted" : "pt-24 sm:pt-36 pb-32 px-4 sm:px-10 flex flex-col lg:flex-row gap-6 lg:gap-10 items-start justify-center animate-in fade-in zoom-in-95 duration-1000 ease-out fill-mode-both relative min-h-screen"}>

          {/* Fondo de Zona de Trabajo Profesional (Big Tech Grid UI) */}
          {!isPreviewMode && (
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex justify-center items-center opacity-[0.04] dark:opacity-[0.08]">
               <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_40%,transparent_100%)]"></div>
            </div>
          )}

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
              <GsapWrapper animationType="fade-up" duration={1} id="teleprompter-container" className="flex-1 w-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth flex flex-col items-center pt-[45vh] pb-[60vh] px-6 sm:px-10 relative z-20">
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
                             ${isActive ? 'opacity-100 scale-100 drop-shadow-[0_0_20px_rgba(var(--primary-raw),0.4)]' : 'opacity-40 scale-100'}
                           `}
                        >
                          {/* Texto de la Línea Gigante con Acordes Perfectamente Alineados */}
                          <div className={`text-white font-black tracking-tight leading-none overflow-visible transition-all duration-500 flex flex-wrap justify-center items-end ${isActive ? 'text-[clamp(2.5rem,5vw,6.5rem)]' : 'text-[clamp(1.8rem,4vw,5rem)]'}`}>
                            {line.words.map((word, wIdx) => (
                              <div key={word.id} className="flex flex-wrap justify-center mr-5 md:mr-8 last:mr-0">
                                {word.syllables.map((syl, i) => (
                                  <div key={syl.id} className="flex flex-col items-start relative pt-3 min-w-max justify-end">

                                    {/* Slot del Acorde (Reserva de altura incluso vacío si la línea lo requiere) */}
                                    {hasChords && (
                                      <div className={`w-full min-h-[1.2em] mb-1 font-sans font-bold text-primary tracking-widest flex items-end relative leading-none ${isActive ? 'text-[clamp(1.5rem,2.8vw,3.5rem)]' : 'text-[clamp(1.2rem,2.2vw,2.8rem)]'}`}>
                                        {syl.chord ? (() => {
                                          const formatted = formatChordText(syl.chord, notation, songKey);
                                          // Aseguramos margen derecho dinámico para evitar solapamientos masivos
                                          return (
                                            <span className="flex items-start z-10 pr-3 lg:pr-5 whitespace-nowrap overflow-visible">
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
                                    <div className="whitespace-pre leading-none pb-2 pt-1">{syl.text}</div>

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
                title={t('close_preview')}
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
            <EditorSettingsSidebar
              isReadOnly={isReadOnly}

              handleTranspose={handleTranspose}
              show3DPiano={show3DPiano}
              setShow3DPiano={setShow3DPiano}
              editorColumns={editorColumns}
              setEditorColumns={setEditorColumns}
              layout={layout}
              updateLayout={updateLayout}
              songKey={songKey}
              setSongKey={setSongKey}
              includeChordsDictionary={includeChordsDictionary}
              setIncludeChordsDictionary={setIncludeChordsDictionary}
              onPlayTeleprompter={togglePlay}
              onOpenExport={() => setIsExportModalOpen(true)}
            />
          )}

          {/* MOTOR DE PAGINACIÓN A4 Y SLIDER HORIZONTAL */}
          <div
            ref={pagesContainerRef}
            onDragOver={(e) => {
              if(!isReadOnly) {
                e.preventDefault(); // Permite soltar en área vacía
              }
            }}
            onDrop={(e) => {
              if (isReadOnly || !draggedSectionId) return;
              e.preventDefault();
              
              // Mover estrofa al final del documento
              const draggedIndex = song!.sections.findIndex(s => s.id === draggedSectionId);
              if (draggedIndex !== -1 && draggedIndex !== song!.sections.length - 1) {
                 const newSections = [...song!.sections];
                 const [removed] = newSections.splice(draggedIndex, 1);
                 newSections.push(removed);
                 setSong({...song!, sections: newSections});
              }
              setDraggedSectionId(null);
            }}
            className={
              isPreviewMode
                ? "flex-1 w-full flex flex-col items-center overflow-y-auto py-12 px-2 sm:px-4 shadow-inner hide-scrollbar bg-muted gap-8 relative"
                : "flex gap-6 lg:gap-12 overflow-x-auto snap-x lg:snap-mandatory hide-scrollbar pb-12 w-full lg:pr-[50vw] relative"
            }
          >

            
            {/* 
              Cálculo definitivo de capacidad. 
              Altura A4 física: 1123px. 
              Padding contenedor: 160px (abajó) + 64px (arriba).
              Header: ~108px. 
              Límite matemático JS expandido a 820px para asegurar que las columnas aprovechen el máximo real estate físico sin desbordar el footer.
            */}
            {song && (() => {
               const pageW = isLand ? (isLetter ? 1056 : 1123) : (isLetter ? 816 : 794);
               const pageH = isLand ? (isLetter ? 816 : 794) : (isLetter ? 1056 : 1123);
               // Use dynamic variables from outside
               
               return paginateSong(song, baseLinesPerColumn, activeColumns).map((page, index) => (
                 <div
                   key={page.id}
                   style={{ width: `${pageW}px`, minWidth: `${pageW}px`, maxWidth: `${pageW}px`, height: `${pageH}px`, minHeight: `${pageH}px`, maxHeight: `${pageH}px` }}
                className={`a4-page bg-background text-foreground ${activeMarginClass} overflow-hidden relative lg:shadow-[0_30px_60px_-15px_rgba(var(--primary-raw),0.15)] transition-all duration-500 flex flex-col justify-start ring-0 lg:ring-1 lg:ring-border origin-top rounded-xl lg:rounded-none border border-border lg:border-none
                ${isPreviewMode ? 'transform shrink-0 scale-[0.6] sm:scale-75 lg:scale-[0.85] -mt-[40mm] sm:-mt-[20mm] lg:-mt-[10mm]' : 'shrink-0 lg:snap-center'}
              `}
              >
                {/* HEADER DE PAGINA CONDICIONAL */}
                {index === 0 ? (
                  hasMultipleSongs ? (
                    <div className="mb-6 shrink-0 border-b border-gray-200 dark:border-gray-800 pb-4">
                      <h1 className={`text-2xl sm:text-3xl font-serif font-black italic tracking-tight w-full ${layout.alignment === 'justify-center' ? 'text-center' : layout.alignment === 'justify-end' ? 'text-right' : layout.alignment === 'justify-between' ? 'text-justify' : 'text-left'}`}>
                        {!isReadOnly ? (
                          <input 
                            value={song.title} 
                            onChange={(e) => setSong({...song, title: e.target.value} as any)}
                            className={`bg-transparent border-none outline-none w-full ${layout.alignment === 'justify-center' ? 'text-center' : layout.alignment === 'justify-end' ? 'text-right' : layout.alignment === 'justify-between' ? 'text-justify' : 'text-left'}`}
                          />
                        ) : song.title}
                      </h1>
                    </div>
                  ) : (
                    <div className="mb-3 shrink-0 flex flex-col w-full">
                      <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight break-words leading-[1.1] mb-2 w-full ${layout.alignment === 'justify-center' ? 'text-center' : layout.alignment === 'justify-end' ? 'text-right' : layout.alignment === 'justify-between' ? 'text-justify' : 'text-left'}`}>
                        {!isReadOnly ? (
                          <textarea 
                            value={song.title} 
                            onChange={(e) => setSong({...song, title: e.target.value} as any)}
                            className="bg-transparent border-b border-transparent hover:border-gray-200 focus:border-primary outline-none w-full transition-colors resize-none overflow-hidden"
                            rows={1}
                            onInput={(e) => {
                              // Auto-resize
                              e.currentTarget.style.height = 'auto';
                              e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                            }}
                          />
                        ) : song.title}
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
                                onChange={(e) => setSong({ ...song, bpm: parseInt(e.target.value) || 0 })}
                                className="bg-transparent text-black dark:text-white font-bold outline-none w-10 text-center border-b border-transparent hover:border-gray-300 focus:border-primary transition-colors cursor-text"
                              />
                              <span className="text-black dark:text-white">BPM</span>
                            </div>
                          )}
                        </span>
                        <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1 min-w-[50px] max-w-[200px]"></div>
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
                <div className={`grid grid-cols-1 ${({ 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' } as Record<number, string>)[activeColumns] || 'grid-cols-1'} gap-8 sm:gap-12 w-full mt-2 flex-grow items-start`}>
                  {Array.from({ length: activeColumns }).map((_, colIdx) => {
                    const col = page.columns[colIdx] || [];
                    return (
                      <div key={`col-${page.id}-${colIdx}`} className="col-span-1 flex flex-col gap-6 sm:gap-8">
                      {col.map((section, sIdx) => (
                        <div
                          key={`${section.id}-${sIdx}`}
                          className={`flex flex-col gap-1 sm:gap-2 relative group break-inside-avoid w-full ${!isReadOnly ? 'cursor-grab active:cursor-grabbing hover:bg-black/5 dark:hover:bg-white/5 rounded-xl p-2 -m-2 transition-all' : ''} ${draggedSectionId === section.id ? 'opacity-30' : ''} ${dragOverSectionId === section.id && dragOverDirection === 'top' ? 'border-t-2 border-t-primary !pt-4' : ''} ${dragOverSectionId === section.id && dragOverDirection === 'bottom' ? 'border-b-2 border-b-primary !pb-4' : ''}`}
                          draggable={!isReadOnly}
                          onDragStart={(e) => {
                            if (isReadOnly) return;
                            setDraggedSectionId(section.id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragOver={(e) => {
                            if (isReadOnly || !draggedSectionId || draggedSectionId === section.id) return;
                            e.preventDefault();
                            e.stopPropagation();
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
                            e.stopPropagation();
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

                          {/* Título de la sección o canción (Editable) */}
                          {!section.isContinuation && (section.title || !isReadOnly) && (
                            <div className={`w-full flex ${section.title ? 'mt-2 mb-2 relative' : 'mb-0 overflow-visible relative'}`}>
                               <input
                                  readOnly={isReadOnly}
                                  type="text"
                                  placeholder="Añadir Título (Canción o Sección)..."
                                  value={section.title || ''}
                                  onChange={(e) => {
                                    setSong(current => {
                                      if (!current) return current;
                                      return {
                                        ...current,
                                        sections: current.sections.map(s => s.id === section.id ? { ...s, title: e.target.value } : s)
                                      };
                                    });
                                  }}
                                  className={`bg-transparent border-none outline-none italic tracking-tight w-full placeholder:text-foreground/50
                                    ${layout.alignment === 'justify-center' ? 'text-center' : layout.alignment === 'justify-end' ? 'text-right' : layout.alignment === 'justify-between' ? 'text-justify' : 'text-left'} 
                                    ${/^(?:[IVX]+\.|\d+\.)/i.test(section.title || '') ? 'font-serif font-black text-lg sm:text-xl opacity-90' : 'font-sans font-black text-xl sm:text-2xl opacity-90'} 
                                    ${!section.title ? 'text-[11px] font-bold absolute -top-5 left-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity font-sans not-italic placeholder:text-foreground/40 pointer-events-none group-hover:pointer-events-auto focus:pointer-events-auto z-10' : ''}
                                  `}
                                />
                            </div>
                          )}

                          {/* Minimalist Section Label con Repetidor Numérico - Sólo si empieza aquí */}
                          {!section.isContinuation && (
                            <div className="flex items-center gap-2 sm:gap-4 group/secHeader w-full flex-nowrap border-b border-border/10 pb-2">
                              <span className="text-[10px] sm:text-[11px] font-black tracking-[0.4em] text-zinc-400 dark:text-zinc-500 uppercase flex items-center gap-2 shrink-0">
                                <select
                                  value={section.type}
                                  onChange={(e) => handleSectionTypeChange(section.id, e.target.value)}
                                  className="bg-transparent border-none appearance-none outline-none font-black tracking-[0.4em] uppercase text-zinc-400 dark:text-zinc-500 cursor-pointer hover:text-primary transition-colors focus:outline-none focus:ring-0 max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap"
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
                                  className="text-zinc-300 dark:text-zinc-600 cursor-pointer hover:text-primary transition-colors hover:scale-110 active:scale-95 px-1 font-bold"
                                  title="Cambiar repeticiones"
                                >
                                  X {section.repeat || 1}
                                </span>
                              </span>

                              <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1 opacity-0 group-hover/secHeader:opacity-100 transition-opacity min-w-[10px]"></div>

                              <div className="flex items-center gap-1 sm:gap-2 shrink-0 z-20 justify-end transition-all flex-nowrap">
                                <div className="flex items-center gap-1.5 opacity-0 group-hover/secHeader:opacity-100 transition-opacity">
                                  {(() => {
                                    const hasChords = section.lines.some(l => l.words.some(w => w.syllables.some(s => s.chord !== null)));
                                    const globalSecIdx = song.sections.findIndex(s => s.id === section.id);
                                    if (!hasChords && globalSecIdx > 0 && !isReadOnly) {
                                      return (
                                        <button
                                          onClick={() => handleAutoFillChords(section.id)}
                                          className="px-3 py-1.5 bg-red-400/10 hover:bg-red-400/20 text-red-400 text-[9px] font-black tracking-widest uppercase rounded flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                                          title="Copiar acordes de la estrofa anterior idéntica"
                                        >
                                          <span>✨</span> AUTO-RELLENAR
                                        </button>
                                      );
                                    }
                                    return null;
                                  })()}

                                  {!isReadOnly && (
                                    <>
                                      <button
                                        onClick={() => handleMergeWithNext(section.id)}
                                        className="text-zinc-600 dark:text-zinc-400 hover:text-white hover:bg-zinc-700 dark:hover:bg-zinc-800 bg-zinc-200 dark:bg-[#1E1E1E] px-3 py-1.5 rounded transition-all text-[9px] font-black tracking-widest uppercase shadow-sm"
                                        title="Unir con la siguiente estrofa"
                                      >
                                        ↑ UNIR
                                      </button>
                                      <button
                                        onClick={() => handleDuplicateSection(section.id)}
                                        className="text-zinc-600 dark:text-zinc-400 hover:text-white hover:bg-zinc-700 dark:hover:bg-zinc-800 bg-zinc-200 dark:bg-[#1E1E1E] p-1.5 rounded transition-all shadow-sm flex items-center justify-center w-7 h-7"
                                        title="Duplicar esta estrofa"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[14px] h-[14px]">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleRemoveSectionChords(section.id)}
                                        className="text-zinc-600 dark:text-zinc-400 hover:text-white hover:bg-zinc-700 dark:hover:bg-zinc-800 bg-zinc-200 dark:bg-[#1E1E1E] p-1.5 rounded transition-all shadow-sm flex items-center justify-center w-7 h-7"
                                        title="Borrar todos los acordes de la estrofa"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-[14px] h-[14px]">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSection(section.id)}
                                        className="text-zinc-600 dark:text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 bg-zinc-200 dark:bg-[#1E1E1E] p-1.5 rounded transition-all shadow-sm flex items-center justify-center w-7 h-7"
                                        title="Eliminar esta estrofa"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[14px] h-[14px]">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                      </button>
                                    </>
                                  )}
                                </div>
                            </div>
                            </div>
                          )}

                          {(() => {
                            let currentHighlightColor: string | undefined = undefined;
                            return (
                              <div className="flex flex-col mt-1 gap-1">
                                {section.lines.map((line) => {
                                  const playingStyle = activeLineId === line.id
                                    ? 'opacity-100 scale-[1.02] transform origin-left ml-4 text-primary'
                                    : isPlaying
                                      ? 'opacity-30 blur-[1px]'
                                      : 'opacity-100';

                                  if (editingLineId === line.id) {
                                      return (
                                        <div key={line.id} className={`flex w-full items-center pt-2 pb-1 relative transition-all duration-300 ${playingStyle}`}>
                                            <input
                                                autoFocus
                                                value={editingLineText}
                                                onChange={(e) => setEditingLineText(e.target.value)}
                                                onBlur={() => handleSaveLineEdit(section.id, line.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveLineEdit(section.id, line.id);
                                                    if (e.key === 'Escape') { setEditingLineId(null); setEditingLineText(""); }
                                                }}
                                                className="flex-1 bg-white/5 border border-primary/50 text-foreground px-4 py-2 rounded-lg shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-bold font-sans transition-all"
                                                placeholder="Escribe la letra aquí..."
                                            />
                                        </div>
                                      );
                                  }

                                  return (
                                    <div
                                      key={line.id}
                                      id={line.id}
                                      className={`flex flex-wrap items-end content-start pt-2 pb-1 ${layout.alignment} transition-all duration-700 ease-in-out relative group/line ${playingStyle} font-${layout.fontFamily} shrink-0 leading-loose`}
                                      style={{
                                        '--base-font': `${layout.baseFontSize || 16}px`,
                                        '--chord-font': `${layout.chordFontSize || 14}px`,
                                        lineHeight: layout.lineHeight || 2.0
                                      } as React.CSSProperties}
                                    >
                                      {line.words.map((word, wIdx) => (
                                        <div key={word.id} className="flex flex-wrap items-end mr-3 sm:mr-4 group/word">
                                          {word.syllables.map((syl, i) => {
                                            
                                            if (syl.chord) {
                                              currentHighlightColor = syl.highlightColor || undefined;
                                              
                                              // Auto-timeline colors feature
                                              if (!currentHighlightColor && (layout as any).showTimelines) {
                                                  const tc = (layout as any).timelineColor || 'multicolor';
                                                  if (tc === 'multicolor') {
                                                      // Strong, solid colors for mockups
                                                      const COLORS = ["#0ea5e9", "#16a34a", "#a855f7", "#e11d48", "#ea580c"];
                                                      const root = typeof syl.chord === 'string' ? syl.chord : syl.chord.rootNote;
                                                      let h = 0;
                                                      if (root) {
                                                          for(let c=0;c<root.length;c++) h = root.charCodeAt(c) + ((h<<5)-h);
                                                      }
                                                      currentHighlightColor = COLORS[Math.abs(h) % COLORS.length];
                                                  } else {
                                                      currentHighlightColor = tc;
                                                  }
                                              }
                                              
                                            } else if (syl.highlightColor !== undefined) {
                                              currentHighlightColor = syl.highlightColor || undefined;
                                            }

                                            // Determine if the string should conceptually connect to the next syllable
                                            const nextSyl = word.syllables[i + 1] || line.words[wIdx + 1]?.syllables[0];
                                            let nextColor = currentHighlightColor;
                                            if (nextSyl) {
                                                if (nextSyl.chord) {
                                                    let tempNext = nextSyl.highlightColor || undefined;
                                                    if (!tempNext && (layout as any).showTimelines) {
                                                        const tc = (layout as any).timelineColor || 'multicolor';
                                                        if (tc === 'multicolor') {
                                                            const COLORS = ["#0ea5e9", "#16a34a", "#a855f7", "#e11d48", "#ea580c"];
                                                            const root = typeof nextSyl.chord === 'string' ? nextSyl.chord : nextSyl.chord.rootNote;
                                                            let h = 0;
                                                            if (root) for(let c=0;c<root.length;c++) h = root.charCodeAt(c) + ((h<<5)-h);
                                                            tempNext = COLORS[Math.abs(h) % COLORS.length];
                                                        } else {
                                                            tempNext = tc;
                                                        }
                                                    }
                                                    nextColor = tempNext;
                                                } else if (nextSyl.highlightColor !== undefined) {
                                                    nextColor = nextSyl.highlightColor || undefined;
                                                }
                                            } else {
                                                nextColor = undefined; // End of line caps it automatically
                                            }

                                            let maintainsConnection = false;
                                            // Bridge gap only if exact same strong color continues
                                            if (currentHighlightColor && nextColor === currentHighlightColor) {
                                                maintainsConnection = true;
                                            }

                                            return (
                                              <SyllableComponent
                                                key={syl.id}
                                                syllable={syl}
                                                capo={layout.capo || 0}
                                                notation={layout.notation}
                                                songKey={songKey}
                                                instrument={layout.instrument}
                                                colorTheme={colorTheme}
                                                inheritedHighlightColor={currentHighlightColor}
                                                casing={(layout as any).casing}
                                                showTimelines={(layout as any).showTimelines}
                                                isLastInWord={i === word.syllables.length - 1}
                                                continuesHighlight={maintainsConnection}
                                                nextHasChord={Boolean(
                                                  word.syllables[i + 1]?.chord ||
                                                  (!word.syllables[i + 1] && line.words[wIdx + 1]?.syllables[0]?.chord)
                                                )}
                                                onChordChange={(syllableId, newChord, styleOptions) => {
                                                  const realStoredChord = (newChord && typeof newChord !== 'string') ? transposeChord(newChord, (layout.capo || 0)) : null;
                                                  handleChordChange(syllableId, realStoredChord, styleOptions);
                                                }}
                                                onGlobalChordChange={(newChord) => {
                                                  if (syl.chord) {
                                                    const originalStoredOldChord = transposeChord(syl.chord, (layout.capo || 0));
                                                    const realStoredNewChord = (newChord && typeof newChord !== 'string') ? transposeChord(newChord, (layout.capo || 0)) : null;
                                                    handleGlobalChordChange(originalStoredOldChord, realStoredNewChord);
                                                  }
                                                }}
                                                readOnly={isReadOnly}
                                                showChords={layout.showChords}
                                              />
                                            )
                                          })}
                                        </div>
                                      ))}


                                  {!isReadOnly && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-zinc-100 dark:bg-[#1A1A1A] p-1.5 rounded-lg items-center gap-1.5 opacity-0 group-hover/line:opacity-100 flex shadow-sm origin-right pointer-events-none group-hover/line:pointer-events-auto transform translate-x-4 group-hover/line:translate-x-0 transition-all duration-300 border border-zinc-200 dark:border-zinc-800/80">
                                      <button
                                        onClick={() => {
                                          const text = line.words.map(w => w.syllables.map(s => s.text).join('')).join(' ');
                                          setEditingLineText(text);
                                          setEditingLineId(line.id);
                                        }}
                                        className="text-[9px] font-black text-white bg-blue-500 hover:bg-blue-600 rounded px-2.5 py-1.5 tracking-widest transition-all uppercase whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                                        title="Editar letra de la línea"
                                      >
                                        ✎ EDITAR
                                      </button>
                                      <button                                        onClick={() => handleSplitSection(section.id, line.id)}
                                        className="text-[9px] font-black text-zinc-500 hover:text-white bg-zinc-200 dark:bg-[#252525] hover:bg-zinc-700 dark:hover:bg-zinc-700 rounded px-2.5 py-1.5 tracking-widest transition-all uppercase whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                                        title="Separar estrofa a partir de esta línea hacia abajo"
                                      >
                                        ↓ SEPARAR
                                      </button>
                                      
                                      <button
                                        onClick={() => handleRemoveLineChords(section.id, line.id)}
                                        className="text-[9px] font-black text-zinc-500 hover:text-white bg-zinc-200 dark:bg-[#252525] hover:bg-zinc-700 dark:hover:bg-zinc-700 rounded px-2.0 py-1.5 tracking-widest transition-all uppercase whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                                        title="Borrar todos los acordes de esta línea"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-[12px] h-[12px]">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
                                        </svg>
                                      </button>

                                      <button
                                        onClick={() => handleAddTrailingChord(section.id, line.id)}
                                        className="text-[9px] font-black text-white bg-red-500/90 dark:bg-[#8e2936] hover:bg-red-500 rounded px-3 py-1.5 tracking-widest hover:scale-[1.03] active:scale-95 transition-all shadow-[0_2px_10px_rgba(225,29,72,0.2)] uppercase whitespace-nowrap"
                                      >
                                        + ACORDE
                                      </button>
                                      
                                      <span
                                        onClick={() => handleLineRepeatChange(section.id, line.id)}
                                        className="text-[10px] font-black tracking-widest text-zinc-400 hover:text-white cursor-pointer px-2 transition-colors flex items-center justify-center min-w-[30px]"
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
                           );
                          })()}
                        </div>
                      ))}
                    </div>
                    );
                  })}
                </div>

                {/* FOOTER POR PÁGINA (Anclaje Físico Estricto) */}
                <div className="absolute bottom-0 left-0 w-full h-[5rem] lg:h-[6rem] bg-background flex flex-col justify-end px-8 sm:px-12 lg:px-16 pb-6 sm:pb-8 lg:pb-12 text-muted-foreground/60 shrink-0 z-20 pointer-events-none">
                  <div className="w-auto absolute top-0 left-8 right-8 sm:left-12 sm:right-12 lg:left-16 lg:right-16 h-px bg-border/30"></div>
                  <div className="flex justify-between items-end w-full">
                    <p className="text-[8px] font-bold tracking-[0.2em] uppercase">
                      Aura <span className="font-black inline-block px-1 text-primary pointer-events-auto">Chords</span>
                    </p>
                    <p className="text-[8px] font-bold tracking-[0.2em] uppercase">
                      {new Date().getFullYear()} - PÁG {index + 1}
                    </p>
                  </div>
                </div>
              </div>
            ))})()}

            {/* DICCIONARIO DE ACORDES (Páginas dinámicas según cantidad de acordes) */}
            {includeChordsDictionary && uniqueChords.length > 0 && (() => {
               // 4 columnas x 4 filas = 16 acordes máximo por página A4 para que no toque el footer jamás
               const CHORDS_PER_PAGE = 16;
               const dictPages = [];
               for (let i = 0; i < uniqueChords.length; i += CHORDS_PER_PAGE) {
                 dictPages.push(uniqueChords.slice(i, i + CHORDS_PER_PAGE));
               }
               
               const basePagesCount = song ? paginateSong(song, baseLinesPerColumn, activeColumns).length : 1;

               return dictPages.map((chordChunk, chunkIdx) => (
                <div key={`dict-page-${chunkIdx}`} className={`a4-page relative w-[794px] h-[1123px] shrink-0 shadow-2xl overflow-hidden flex flex-col bg-background ${fontFamily}`} style={{ pageBreakAfter: 'always' }}>
                  <div className="pt-24 px-16 pb-32 lg:pb-[8rem] flex-1 flex flex-col items-center text-center">
                    {/* El título solo va en la primera página del diccionario */}
                    {chunkIdx === 0 && (
                      <h2 className="text-3xl font-black tracking-[0.2em] text-primary mb-12 uppercase text-center w-full border-b border-border pb-6 drop-shadow-sm">Diccionario de Acordes</h2>
                    )}
                    {chunkIdx > 0 && (
                       <div className="mb-12 w-full pt-10"></div>
                    )}
                    <div className="grid grid-cols-4 gap-y-12 gap-x-8 w-full place-items-center">
                       {chordChunk.map((chord, idx) => {
                         const formatted = formatChordText(chord, notation, songKey);
                         const capoAmount = layout.capo || 0;
                         const guitarChord = capoAmount > 0 ? transposeChord(chord, -capoAmount)! : chord;
                         return (
                           <div key={idx} className="flex flex-col items-center gap-5 w-full shrink-0">
                               <div className="text-[26px] font-black font-sans text-foreground flex items-end tracking-tight flex-col items-center justify-center">
                                   <div>
                                     {formatted.root}
                                     {formatted.variation && <span className="text-[14px] font-bold relative -top-2 ml-0.5">{formatted.variation}</span>}
                                     {formatted.bass && <span className="text-[16px] ml-1 opacity-70">/{formatted.bass}</span>}
                                   </div>
                                   {capoAmount > 0 && layout.instrument === 'guitar' && (
                                     <span className="text-[12px] font-normal text-gray-500 tracking-normal opacity-80 mt-[-5px]">
                                       (forma de {formatChordText(guitarChord, notation, songKey).root})
                                     </span>
                                   )}
                               </div>
                               {layout.instrument === 'guitar' 
                                 ? <MiniGuitar2D chord={guitarChord} themeColor={colorTheme} />
                                 : <MiniPiano2D chord={chord} themeColor={colorTheme} className="w-[124px] shadow-sm rounded-sm" />}
                           </div>
                         );
                       })}
                    </div>
                  </div>
                  
                  {/* FOOTER POR PÁGINA (Anclaje Físico Estricto) */}
                  <div className="absolute bottom-0 left-0 w-full h-[5rem] lg:h-[6rem] bg-background flex flex-col justify-end px-8 sm:px-12 lg:px-16 pb-6 sm:pb-8 lg:pb-12 text-muted-foreground/60 shrink-0 z-20 pointer-events-none">
                    <div className="w-auto absolute top-0 left-8 right-8 sm:left-12 sm:right-12 lg:left-16 lg:right-16 h-px bg-border/30"></div>
                    <div className="flex justify-between items-end w-full">
                      <p className="text-[8px] font-bold tracking-[0.2em] uppercase">
                        Aura <span className="font-black inline-block px-1 text-primary pointer-events-auto">Chords</span>
                      </p>
                      <p className="text-[8px] font-bold tracking-[0.2em] uppercase">
                        {new Date().getFullYear()} - PÁG {basePagesCount + chunkIdx + 1}
                      </p>
                    </div>
                  </div>
                </div>
               ));
            })()}

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

              <div className={`flex-1 w-full h-full relative cursor-move ${layout.instrument === 'guitar' ? 'px-4' : ''}`}>
                {layout.instrument === 'guitar' ? (
                  <LiveGuitarFretboard
                    activeChord={active3DChord}
                    themeColor={colorTheme}
                  />
                ) : (
                  <Piano3D
                    activeKeys={active3DChord ? getChordKeys(active3DChord.rootNote, active3DChord.variation, active3DChord.bassNote) : []}
                    themeColor={colorTheme}
                  />
                )}
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
          includeDictionary={includeChordsDictionary}
          setIncludeDictionary={setIncludeChordsDictionary}
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
