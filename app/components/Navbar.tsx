"use client";

import Link from "next/link";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import NotificationBell from "./NotificationBell";

interface NavbarProps {
  variant?: "default" | "transparent" | "editor" | "border";
  className?: string;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  saveStatus?: 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
  lastSaved?: Date | null;
  forceSave?: () => void;
}

export default function Navbar({ variant = "default", className = "", centerContent, rightContent, saveStatus, lastSaved, forceSave }: NavbarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  let navClasses = "w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between fixed top-0 z-50 ";

  switch (variant) {
    case "transparent":
      navClasses += "py-3 sm:py-3 lg:py-3 text-foreground mix-blend-difference ";
      break;
    case "editor":
      navClasses += "py-3 sm:py-3 lg:py-3 bg-background/95 backdrop-blur-md border-b border-border shadow-sm transition-transform duration-500 ";
      break;
    case "border":
      navClasses += "py-3 sm:py-3 lg:py-3 bg-background/80 backdrop-blur-md border-b border-border ";
      break;
    default:
      navClasses += "py-3 sm:py-3 lg:py-3 bg-background/80 backdrop-blur-md ";
      break;
  }

  navClasses += className;

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname?.startsWith(path);
  };

  const linkClass = (path: string) => 
    `cursor-pointer transition-colors pb-1 border-b-2 ${
      isActive(path) 
        ? "text-primary border-primary" 
        : "text-muted-foreground border-transparent hover:text-foreground"
    }`;

  return (
    <nav className={navClasses}>
      <div className="flex-shrink-0 flex items-center">
        <Link href="/" className="flex items-center gap-2 group">
          
          {/* ISOTIPO SVG HIGH-QUALITY (Exact Logo 2 Style) */}
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 transform group-hover:scale-110 transition-transform duration-300">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" style={{ filter: "drop-shadow(0px 0px 6px rgba(6, 182, 212, 0.4))" }}>
              <defs>
                 <linearGradient id="aura-grad-exact" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" /> {/* Deep Indigo / Violet  */}
                    <stop offset="100%" stopColor="#06b6d4" /> {/* Bright Cyan */}
                 </linearGradient>
              </defs>
              {/* Círculo Principal */}
              <circle cx="20" cy="20" r="11" stroke="url(#aura-grad-exact)" strokeWidth="4" />
              {/* Línea cruzada que sobresale el círculo (Tensión/Cuerda) */}
              <path d="M6 34 L34 6" stroke="url(#aura-grad-exact)" strokeWidth="4" strokeLinecap="butt" />
            </svg>
          </div>

          {/* TIPOGRAFÍA DINÁMICA */}
          <span className="font-black text-xl sm:text-2xl tracking-tighter whitespace-nowrap text-foreground group-hover:opacity-80 transition-opacity duration-300">
            Aura<span className="font-light">Chords</span>
          </span>

        </Link>
      </div>
      
      {/* Desktop Navigation */}
      {centerContent || (
        <div className="hidden lg:flex items-center gap-10 text-[10px] font-bold tracking-[0.2em] uppercase">
          <Link href="/" className={linkClass("/")}>Inicio</Link>
          <Link href="/search" className={linkClass("/search")}>Buscar Letras</Link>
          <Link href="/community" className={linkClass("/community")}>Comunidad</Link>
          <Link href="/pricing" className={linkClass("/pricing")}>Planes (Pro)</Link>
        </div>
      )}

      {/* Desktop Right Content */}
      <div className="hidden lg:flex shrink min-w-0 items-center justify-end gap-6 overflow-hidden">
        {rightContent || (
          <>
            <SignedOut>
              <div className="rounded-full overflow-hidden group">
                <SignInButton mode="modal">
                  <button className="px-6 py-3 w-full h-full bg-primary text-primary-foreground text-[10px] font-bold tracking-[0.2em] uppercase hover:scale-105 active:scale-95 transition-all text-center whitespace-nowrap outline-none border-none">
                    Entrar al Estudio
                  </button>
                </SignInButton>
              </div>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="px-6 py-3 bg-primary text-primary-foreground text-[10px] font-bold tracking-[0.2em] uppercase rounded-full hover:bg-primary/80 transition-all text-center whitespace-nowrap">
                 Mi Estudio
              </Link>
              <div className="flex items-center gap-4 ml-2">
                 <NotificationBell />
                 <div className="scale-110"><UserButton /></div>
              </div>
            </SignedIn>
          </>
        )}
      </div>

      {/* Mobile Hamburger */}
      <div className="lg:hidden flex items-center gap-4">
        <SignedIn>
           <NotificationBell />
           <UserButton />
        </SignedIn>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="text-foreground p-2"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-background border-b border-border shadow-lg flex flex-col p-6 gap-6 lg:hidden max-h-[80vh] overflow-y-auto">
          {centerContent ? centerContent : (
            <div className="flex flex-col gap-6 text-sm font-bold tracking-[0.2em] uppercase">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className={linkClass("/")}>Inicio</Link>
              <Link href="/search" onClick={() => setIsMobileMenuOpen(false)} className={linkClass("/search")}>Buscar Letras</Link>
              <Link href="/community" onClick={() => setIsMobileMenuOpen(false)} className={linkClass("/community")}>Comunidad</Link>
              <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)} className={linkClass("/pricing")}>Planes (Pro)</Link>
            </div>
          )}
          
          <div className="w-full h-[1px] bg-border my-2"></div>

          {rightContent ? rightContent : (
            <div className="flex flex-col gap-4 w-full">
              <SignedOut>
                <div className="rounded-full overflow-hidden w-full">
                  <SignInButton mode="modal">
                    <button className="w-full py-4 bg-primary text-primary-foreground text-xs font-bold tracking-[0.2em] uppercase hover:scale-105 active:scale-95 transition-all text-center outline-none border-none">
                      Entrar al Estudio
                    </button>
                  </SignInButton>
                </div>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="w-full block py-4 bg-primary text-primary-foreground text-xs font-bold tracking-[0.2em] uppercase rounded-full transition-all text-center hover:bg-primary/80">
                  Mi Estudio
                </Link>
              </SignedIn>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
 
