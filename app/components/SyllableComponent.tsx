"use client";

import { useState, useCallback } from "react";
import { 
  useFloating, autoUpdate, offset, flip, shift, 
  useClick, useDismiss, useInteractions, FloatingPortal, useHover, safePolygon 
} from '@floating-ui/react';
import type { Syllable, Chord } from "../config/config";
import ChordEditorMenu from "./ChordEditorMenu";
import { formatChordText, NotationType } from "../helpers/chordFormatter";
import MiniGuitar2D from "./MiniGuitar2D";
import { transposeChord } from "../helpers/transpose";
import { getChordKeys } from "../helpers/chordToPianoKeys";
import { audioEngine } from "../helpers/audioEngine";

export interface SyllableProps {
  syllable: Syllable;
  capo?: number;
  onChordChange: (syllableId: string, newChord: Chord | null, styleOptions?: { highlightColor?: string, casing?: string }) => void;
  onGlobalChordChange?: (newChord: Chord | null) => void;
  nextHasChord?: boolean;
  notation?: NotationType;
  songKey?: string;
  readOnly?: boolean;
  showChords?: boolean;
  instrument?: 'piano' | 'guitar';
  colorTheme?: string;
  inheritedHighlightColor?: string;
  isLastInWord?: boolean;
  casing?: 'default' | 'uppercase' | 'lowercase';
}

export default function SyllableComponent({ 
  syllable, capo = 0, onChordChange, onGlobalChordChange, nextHasChord = true, notation = 'english', songKey = 'C', readOnly = false, showChords = true, instrument = 'piano', colorTheme, inheritedHighlightColor, isLastInWord, casing
}: SyllableProps) {
  const { id, text, chord } = syllable;
  
  // click menu state
  const [isClickOpen, setIsClickOpen] = useState(false);
  // hover panel state
  const [isHoverOpen, setIsHoverOpen] = useState(false);
  
  const [replaceGlobal, setReplaceGlobal] = useState(false);

  const { refs: clickRefs, floatingStyles: clickStyles, context: clickContext } = useFloating({
    open: isClickOpen,
    onOpenChange: setIsClickOpen,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [ offset(8), flip({ fallbackAxisSideDirection: 'end' }), shift({ padding: 10 }) ],
  });

  const { refs: hoverRefs, floatingStyles: hoverStyles, context: hoverContext } = useFloating({
    open: isHoverOpen,
    onOpenChange: setIsHoverOpen,
    placement: 'top',
    whileElementsMounted: autoUpdate,
    middleware: [ offset(12), flip(), shift({ padding: 10 }) ],
  });

  const click = useClick(clickContext, { enabled: !readOnly });
  const dismissClick = useDismiss(clickContext);

  const hover = useHover(hoverContext, { 
    enabled: !readOnly && instrument === 'guitar' && !!chord && !isClickOpen,
    handleClose: safePolygon({ blockPointerEvents: true }),
    delay: { open: 200, close: 100 }
  });
  const dismissHover = useDismiss(hoverContext);

  const { getReferenceProps: getClickRefProps } = useInteractions([click, dismissClick]);
  const { getReferenceProps: getHoverRefProps, getFloatingProps: getHoverFloatingProps } = useInteractions([hover, dismissHover]);

  const handleActionClick = useCallback(() => {
     if (chord) {
         window.dispatchEvent(new CustomEvent('chord-picker-opened', { detail: { chord } }));
         if (audioEngine) {
            const keys = getChordKeys(chord.rootNote, chord.variation, chord.bassNote || undefined);
            audioEngine.playChord(keys, instrument);
         }
     }
  }, [chord]);

  const handleSaveClickMenu = useCallback((newChord: Chord | null, styleOptions?: { highlightColor?: string, casing?: string }) => {
    setIsClickOpen(false);
    if (replaceGlobal && onGlobalChordChange) {
       onGlobalChordChange(newChord);
    } else {
       onChordChange(id, newChord, styleOptions);
    }
  }, [id, onChordChange, onGlobalChordChange, replaceGlobal]);

  const handleSaveHoverMenu = useCallback(() => {
    setIsHoverOpen(false);
    // actually, in the hover menu, they select a new chord or apply it replacing all.
    // Since we don't have variants right now, if "Cambiar todos" is active conceptually we would change them.
    // wait, where do they pick the new chord if it's just the hover menu? They would click "Cambiar acorde", which opens the normal click menu!
  }, []);

  return (
    <>
      <span 
        ref={(node) => {
          clickRefs.setReference(node);
          hoverRefs.setReference(node);
        }}
        {...getClickRefProps(getHoverRefProps({
          onClick: handleActionClick,
          onKeyDown: (e) => {
            if ((e.key === "Enter" || e.key === " ") && chord) {
              window.dispatchEvent(new CustomEvent('chord-picker-opened', { detail: { chord } }));
              if (audioEngine) {
                 const keys = getChordKeys(chord.rootNote, chord.variation, chord.bassNote || undefined);
                 audioEngine.playChord(keys, instrument);
              }
            }
          }
        }))}
        role="button"
        tabIndex={0}
        className={
          "relative inline-block text-left align-bottom group/syl transition-all duration-300 outline-none rounded-sm " +
          (readOnly ? "cursor-default" : "cursor-pointer hover:bg-black/[0.04] focus-visible:bg-black/5 focus-visible:ring-1 focus-visible:ring-black")
        }
        aria-label={`Sílaba: ${text}, Acorde: ${chord ? chord.rootNote + chord.variation : "ninguno"}`}
      >
        {showChords && (
          <span 
            className={`flex items-end min-h-[1.5em] w-full mb-0.5 text-[length:var(--chord-font)] font-bold tracking-tight select-none opacity-90 group-hover/syl:opacity-100 transition-opacity relative z-0 ${!inheritedHighlightColor ? 'text-primary' : ''}`}
            aria-hidden="true"
          >
            {/* The absolute pill bar for highlighting. It merges seamlessly between syllables using negative left/right. */}
            {inheritedHighlightColor && (
              <span 
                className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full z-[-1] pointer-events-none"
                style={{ 
                  backgroundColor: inheritedHighlightColor, 
                  left: '-0.2rem',   // Overlap prev slightly
                  right: isLastInWord ? '-1.5rem' : '-0.2rem' // Bridge the word gap or overlap next
                }}
              />
            )}

            {chord ? (() => {
              const formatted = formatChordText(chord, notation, songKey);
              return (
                <span className={`inline-block whitespace-nowrap z-10 bg-background group-active/syl:scale-95 transition-transform duration-100 pr-1 sm:pr-2 ${nextHasChord && !isLastInWord ? 'mr-2' : ''}`}>
                  <span className="text-[1.05em]">{formatted.root}</span>
                  {formatted.variation && <span className="text-[0.65em] ml-[1px] font-normal tracking-wider relative -top-[0.25em]">{formatted.variation}</span>}
                  {formatted.bass && <span className="text-[0.8em] font-normal opacity-80 ml-[0.5px]">/{formatted.bass}</span>}
                </span>
              );
            })() : (
               <span className={`opacity-0 ${!readOnly ? 'group-hover/syl:opacity-100' : ''} inline-block z-10 bg-background text-[0.8em] font-light text-gray-400 transition-opacity absolute left-1/2 -translate-x-1/2 pointer-events-none px-1`}>+</span>
            )}
          </span>
        )}
        <span 
          className={`block text-[length:var(--base-font)] font-normal tracking-normal leading-tight ${casing === 'uppercase' ? 'uppercase' : casing === 'lowercase' ? 'lowercase' : ''}`}
          style={{ color: 'var(--foreground)' }}
        >
          {text}
        </span>
      </span>

      {/* Menú de Click Tradicional */}
      {isClickOpen && (
        <FloatingPortal>
          <div className="fixed inset-0 z-[990] sm:hidden bg-black/20 backdrop-blur-sm animate-in fade-in" />
          <div 
            ref={clickRefs.setFloating} 
            style={clickStyles} 
            className="z-[999] text-black shadow-2xl rounded-xl"
          >
            <ChordEditorMenu
              initialChord={chord}
              initialHighlight={syllable.highlightColor}
              onSave={handleSaveClickMenu}
              onCancel={() => setIsClickOpen(false)}
            />
          </div>
        </FloatingPortal>
      )}

      {/* Hover Panel para Guitarra */}
      {isHoverOpen && chord && instrument === 'guitar' && (
        <FloatingPortal>
          <div 
            ref={hoverRefs.setFloating} 
            style={hoverStyles} 
            {...getHoverFloatingProps()}
            className="z-[999] bg-white dark:bg-[#1a1a1a] p-4 shadow-2xl border border-gray-100 dark:border-gray-800 rounded-xl flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex flex-col items-center gap-1 w-full">
              {capo > 0 ? (
                <span className="text-sm font-bold opacity-50 mb-1 flex items-center gap-1">
                  <span>{formatChordText(chord, notation, songKey).root}{formatChordText(chord, notation, songKey).variation}</span>
                  <span className="text-[10px] font-normal opacity-80">(forma de {formatChordText(transposeChord(chord, -capo)!, notation, songKey).root})</span>
                </span>
              ) : (
                <span className="text-sm font-bold opacity-50 mb-1">{formatChordText(chord, notation, songKey).root}{formatChordText(chord, notation, songKey).variation}</span>
              )}
              <MiniGuitar2D chord={transposeChord(chord, -capo)!} themeColor={colorTheme} className="w-[100px] shadow-sm rounded-sm" />
            </div>
            
            <button 
               onClick={() => { setIsHoverOpen(false); setIsClickOpen(true); }}
               className="text-[10px] w-full py-1.5 uppercase font-bold tracking-widest bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white rounded border border-transparent transition-colors"
            >
               Cambiar Acorde
            </button>

            <div className="border-t border-gray-100 dark:border-gray-800 w-full pt-3 flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={replaceGlobal} 
                  onChange={e => setReplaceGlobal(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary focus:ring-opacity-25 border-gray-300 dark:border-gray-700 cursor-pointer" 
                />
                <span className="text-[10px] sm:text-xs text-gray-500 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                  Cambiar todos los <span className="font-bold">{formatChordText(chord, notation, songKey).root}</span>
                </span>
              </label>

              <div className="flex items-center justify-between gap-3 w-full mt-2">
                <button onClick={() => setIsHoverOpen(false)} className="text-[10px] w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 font-bold text-gray-500 hover:text-gray-900 border border-transparent dark:text-gray-400 dark:hover:text-white uppercase tracking-widest transition-colors flex-1 text-center py-2 rounded">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}