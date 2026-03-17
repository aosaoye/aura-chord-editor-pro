"use client";

import Link from "next/link";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import Image from "next/image";

interface NavbarProps {
  variant?: "default" | "transparent" | "editor" | "border";
  className?: string;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export default function Navbar({ variant = "default", className = "", centerContent, rightContent }: NavbarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  let navClasses = "w-full px-4 sm:px-6 lg:px-16 flex items-center justify-between fixed top-0 z-50 ";

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
          <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-lg border border-border group-hover:scale-105 transition-transform duration-300">
             <Image src="/images/logo.png" alt="AuraChords Logo" fill className="object-cover" />
          </div>
          <span className="font-black text-2xl tracking-tighter italic whitespace-nowrap group-hover:text-primary transition-colors duration-300">
            AURA<span className="font-light">CHORDS</span>
          </span>
        </Link>
      </div>
      
      {/* Desktop Navigation */}
      {centerContent || (
        <div className="hidden lg:flex items-center gap-12 text-[10px] font-bold tracking-[0.2em] uppercase">
          <Link href="/" className={linkClass("/")}>Inicio</Link>
          <Link href="/dashboard" className={linkClass("/dashboard")}>Mis Obras</Link>
          <Link href="/community" className={linkClass("/community")}>Comunidad</Link>
          <Link href="/editor" className={linkClass("/editor")}>Estudio</Link>
          <Link href="/pricing" className={linkClass("/pricing")}>Planes (Pro)</Link>
        </div>
      )}

      {/* Desktop Right Content */}
      <div className="hidden lg:flex shrink-0 items-center justify-center gap-6">
        {rightContent || (
          <>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-6 py-3 bg-primary text-primary-foreground text-[10px] font-bold tracking-[0.2em] uppercase rounded-full hover:scale-105 active:scale-95 transition-all text-center whitespace-nowrap">
                  Entrar al Estudio
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="px-6 py-3 bg-primary text-primary-foreground text-[10px] font-bold tracking-[0.2em] uppercase rounded-full hover:bg-primary/80 transition-all text-center whitespace-nowrap">
                 Mi Estudio
              </Link>
              <div className="flex items-center scale-110 ml-2">
                 <UserButton />
              </div>
            </SignedIn>
          </>
        )}
      </div>

      {/* Mobile Hamburger */}
      <div className="lg:hidden flex items-center gap-4">
        <SignedIn>
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
              <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={linkClass("/dashboard")}>Mis Obras</Link>
              <Link href="/community" onClick={() => setIsMobileMenuOpen(false)} className={linkClass("/community")}>Comunidad</Link>
              <Link href="/editor" onClick={() => setIsMobileMenuOpen(false)} className={linkClass("/editor")}>Estudio</Link>
              <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)} className={linkClass("/pricing")}>Planes (Pro)</Link>
            </div>
          )}
          
          <div className="w-full h-[1px] bg-border my-2"></div>

          {rightContent ? rightContent : (
            <div className="flex flex-col gap-4 w-full">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="w-full py-4 bg-primary text-primary-foreground text-xs font-bold tracking-[0.2em] uppercase rounded-full hover:scale-105 active:scale-95 transition-all text-center">
                    Entrar al Estudio
                  </button>
                </SignInButton>
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
