"use client";

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface StarRatingInteractiveProps {
  songId: string;
  myInitialRating?: number;
  onRate?: (newRating: number) => void;
  readOnly?: boolean;
}

export default function StarRatingInteractive({ 
  songId, 
  myInitialRating = 0, 
  onRate,
  readOnly = false 
}: StarRatingInteractiveProps) {
  const [rating, setRating] = useState(myInitialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const starsRef = useRef<(SVGElement | null)[]>([]);

  const handleRate = async (value: number) => {
    if (readOnly || isSubmitting) return;
    
    setIsSubmitting(true);
    const previous = rating;
    setRating(value);

    // Animate star selection
    gsap.fromTo(starsRef.current[value - 1], 
      { scale: 1.5, rotate: -20 }, 
      { scale: 1, rotate: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" }
    );

    try {
      const res = await fetch(`/api/songs/${songId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: value }),
      });
      
      if (!res.ok) throw new Error("Error rating song");
      
      if (onRate) onRate(value);
    } catch (error) {
      console.error(error);
      setRating(previous); // revert
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex gap-1" onMouseLeave={() => !readOnly && setHoverRating(0)}>
      {[1, 2, 3, 4, 5].map((star, idx) => {
        const isActive = star <= (hoverRating || rating);
        return (
          <svg
            key={star}
            ref={(el) => {
              starsRef.current[idx] = el;
            }}
            onMouseEnter={() => !readOnly && setHoverRating(star)}
            onClick={(e) => { e.preventDefault(); handleRate(star); }}
            className={`w-4 h-4 transition-colors ${readOnly ? '' : 'cursor-pointer'} ${isActive ? 'text-amber-500 hover:text-amber-400' : 'text-muted-foreground/30 hover:text-amber-200'}`}
            fill={isActive ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={isActive ? '0' : '2'}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        );
      })}
    </div>
  );
}
