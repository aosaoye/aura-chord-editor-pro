"use client";

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface GsapWrapperProps {
  children: React.ReactNode;
  animationType?: 'fade-up' | 'fade-in' | 'stagger-children' | 'scale-up';
  delay?: number;
  duration?: number;
  className?: string;
}

export default function GsapWrapper({ 
  children, 
  animationType = 'fade-up', 
  delay = 0,
  duration = 1,
  className = ""
}: GsapWrapperProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    
    let ctx = gsap.context(() => {
      switch (animationType) {
        case 'fade-up':
          gsap.fromTo(container.current, 
            { y: 50, opacity: 0 },
            { 
              y: 0, 
              opacity: 1, 
              duration, 
              delay, 
              ease: "power3.out",
              scrollTrigger: {
                trigger: container.current,
                start: "top 85%",
              }
            }
          );
          break;
        case 'fade-in':
          gsap.fromTo(container.current, 
            { opacity: 0 },
            { 
              opacity: 1, 
              duration, 
              delay, 
              ease: "power2.inOut",
              scrollTrigger: {
                trigger: container.current,
                start: "top 90%",
              }
            }
          );
          break;
        case 'scale-up':
          gsap.fromTo(container.current,
            { scale: 0.9, opacity: 0 },
            { 
              scale: 1, 
              opacity: 1, 
              duration, 
              delay, 
              ease: "back.out(1.5)",
              scrollTrigger: {
                trigger: container.current,
                start: "top 85%",
              }
            }
          );
          break;
        case 'stagger-children':
          // Animates immediate children
          gsap.fromTo(container.current?.children || [], 
            { y: 30, opacity: 0 },
            { 
              y: 0, 
              opacity: 1, 
              duration: duration * 0.8, 
              stagger: 0.1,
              delay, 
              ease: "power2.out",
              scrollTrigger: {
                trigger: container.current,
                start: "top 85%",
              }
            }
          );
          break;
      }
    }, container);

    return () => ctx.revert();
  }, [animationType, delay, duration]);

  return <div ref={container} className={className}>{children}</div>;
}
