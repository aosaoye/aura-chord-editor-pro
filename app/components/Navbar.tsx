"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

interface NavbarProps {
  variant?: "default" | "transparent" | "editor";
  className?: string;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export default function Navbar({ variant = "default", className = "", centerContent, rightContent }: NavbarProps) {
  const pathname = usePathname();
  let navClasses = "w-full px-4 sm:px-6 lg:px-16 flex items-center justify-between fixed top-0 z-50 gap-2 sm:gap-4 ";

  switch (variant) {
    case "transparent":
      navClasses += "py-3 sm:py-3 lg:py-3 text-foreground mix-blend-difference ";
      break;
    case "editor":
      navClasses += "py-3 sm:py-3 lg:py-3 bg-background/95 backdrop-blur-md border-b border-border shadow-sm transition-transform duration-500 ";
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
        <Link href="/" className="font-black text-2xl tracking-tighter italic whitespace-nowrap">
          CHORD<span className="font-light">PRO</span>
        </Link>
      </div>
      
      {centerContent || (
        <div className="hidden lg:flex items-center gap-12 text-[10px] font-bold tracking-[0.2em] uppercase">
          <Link href="/" className={linkClass("/")}>Inicio</Link>
          <Link href="/search" className={linkClass("/search")}>Buscador</Link>
          <Link href="/editor" className={linkClass("/editor")}>Estudio</Link>
          <Link href="/settings" className={linkClass("/settings")}>Configuración</Link>
          <Link href="/pricing" className={linkClass("/pricing")}>Planes (Pro)</Link>
        </div>
      )}

      {rightContent || (
        <div className="hidden lg:flex shrink-0 items-center justify-center gap-6">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-6 py-3 bg-primary text-primary-foreground text-[10px] font-bold tracking-[0.2em] uppercase rounded-full hover:scale-105 active:scale-95 transition-all text-center whitespace-nowrap">
                Entrar al Estudio
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/editor" className="px-6 py-3 bg-foreground text-background text-[10px] font-bold tracking-[0.2em] uppercase rounded-full hover:bg-primary transition-all text-center whitespace-nowrap">
               Mi Estudio
            </Link>
            <div className="flex items-center scale-110 ml-2">
               <UserButton />
            </div>
          </SignedIn>
        </div>
      )}
    </nav>
  );
}
