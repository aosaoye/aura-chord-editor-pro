import React from 'react';

export default function GlobalAnimatedBackground() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes drawVectorCSS {
          0% { stroke-dashoffset: 1; opacity: 0; }
          5% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        .animate-draw-vectors path, 
        .animate-draw-vectors line, 
        .animate-draw-vectors circle, 
        .animate-draw-vectors rect, 
        .animate-draw-vectors text {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: drawVectorCSS 4s cubic-bezier(0.2, 0, 0.2, 1) forwards;
        }
        .animate-draw-vectors text { animation-delay: 1.5s; animation-duration: 3s; }
        .animate-draw-vectors circle { animation-delay: 0.2s; animation-duration: 5s; }
        .animate-draw-vectors rect { animation-delay: 0.5s; }
      `}} />

      {/* GLOBAL BACKGROUND - Extremely dark and minimal */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.02]" 
          style={{ backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`, backgroundSize: '100px 100px' }} 
        />
        {/* Deep ambient glows */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] bg-primary/10 blur-[150px] mix-blend-screen rounded-full" />
      </div>
      
      {/* Huge Animated Background Sketch (The Cmaj13 structure) */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.03] dark:opacity-[0.07] mix-blend-multiply dark:mix-blend-screen scale-[1.5] sm:scale-125 md:scale-100 overflow-hidden">
        <svg width="1000" height="1000" viewBox="0 0 1000 1000" className="text-foreground dark:text-primary stroke-current absolute animate-draw-vectors">
          <line x1="0" y1="500" x2="1000" y2="500" strokeWidth="1" strokeDasharray="3 5" opacity="0.3" pathLength={"1"} />
          <line x1="500" y1="0" x2="500" y2="1000" strokeWidth="1" strokeDasharray="3 5" opacity="0.3" pathLength={"1"} />
          <circle cx="500" cy="500" r="400" fill="none" strokeWidth="0.5" strokeDasharray="2 10" opacity="0.3" pathLength={"1"} />
          <circle cx="500" cy="500" r="280" fill="none" strokeWidth="1" opacity="0.4" pathLength={"1"} />
          <circle cx="500" cy="500" r="100" fill="none" strokeWidth="0.5" opacity="0.2" pathLength={"1"} />

          {/* Geometric connecting node lines */}
          <path d="M 220 500 L 500 220 M 500 220 L 780 500 M 780 500 L 500 780 M 500 780 L 220 500" fill="none" strokeWidth="1" opacity="0.3" pathLength={"1"} />
          <path d="M 500 500 L 700 300 M 700 300 Q 800 500 700 700" fill="none" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" pathLength={"1"} />
          
          {/* Subtle geometric annotations */}
          <text x="510" y="490" fontSize="10" opacity="0.5" fontWeight="bold" fontFamily="monospace" pathLength={"1"}>Cmaj13(#11)</text>
          <text x="230" y="490" fontSize="8" opacity="0.3" fontFamily="monospace" pathLength={"1"}>V - 440Hz</text>
          <text x="710" y="310" fontSize="8" opacity="0.3" fontFamily="monospace" pathLength={"1"}>&Delta;7 / tension / orbit</text>
          
          <rect x="215" y="495" width="10" height="10" fill="none" strokeWidth="1" opacity="0.5" pathLength={"1"} />
          <rect x="775" y="495" width="10" height="10" fill="none" strokeWidth="1" opacity="0.5" pathLength={"1"} />
          <rect x="495" y="215" width="10" height="10" fill="none" strokeWidth="1" opacity="0.5" pathLength={"1"} />
          <rect x="495" y="775" width="10" height="10" fill="none" strokeWidth="1" opacity="0.5" pathLength={"1"} />
          
          {/* Sine wave tracing */}
          <path d="M 0 500 Q 125 300 250 500 T 500 500 T 750 500 T 1000 500" fill="none" strokeWidth="0.5" opacity="0.2" pathLength={"1"} />
        </svg>
      </div>
    </>
  );
}
