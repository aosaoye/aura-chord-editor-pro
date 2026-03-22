"use client";

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useTransition, useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

const languages = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (nextLocale: string) => {
    if (nextLocale === locale) {
        setIsOpen(false);
        return;
    }
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-1.5 p-2 rounded-full hover:bg-white/10 transition-colors text-foreground"
        aria-label="Change language"
      >
        <Globe size={18} className={isPending ? "animate-pulse opacity-50 text-primary" : "text-foreground group-hover:text-primary transition-colors"} />
        <span className="text-[10px] font-bold uppercase hidden md:inline-block tracking-wider">{locale}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-[#0A0C12]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full text-left px-4 py-2 text-xs transition-colors hover:bg-white/10 ${
                locale === lang.code ? 'text-primary font-bold bg-white/5' : 'text-foreground/80 hover:text-foreground'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
