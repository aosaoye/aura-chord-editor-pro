import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  return (
    <footer className="bg-zinc-100 dark:bg-zinc-950 border-t border-border relative z-10 w-full mt-auto">
       <div className="max-w-[1800px] mx-auto px-6 sm:px-12 lg:px-16 py-20 flex flex-col md:flex-row justify-between gap-16">
          <div className="flex-1">
             <span className="font-black text-3xl tracking-tighter italic mb-6 block text-foreground">
                AURA<span className="font-light">CHORDS</span>
             </span>
             <p className="text-muted-foreground max-w-sm leading-relaxed text-sm">
               {t('description')}
             </p>
          </div>
          
          <div className="flex gap-16">
            <div className="flex flex-col gap-4">
               <h4 className="font-bold uppercase tracking-widest text-[10px] text-primary">{t('explore')}</h4>
               <Link href="/editor" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{tNav('enter_studio') || 'Estudio'}</Link>
               <Link href="/community" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{tNav('community') || 'Comunidad'}</Link>
               <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pro</Link>
            </div>
            <div className="flex flex-col gap-4">
               <h4 className="font-bold uppercase tracking-widest text-[10px] text-primary">{t('legal')}</h4>
               <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('terms')}</Link>
               <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('privacy')}</Link>
               <a href="mailto:22.osaoye@gmail.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
       </div>
       <div className="border-t border-border py-8 text-center">
          <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase">© 2026 AuraChords. {t('rights')}</p>
       </div>
    </footer>
  );
}
