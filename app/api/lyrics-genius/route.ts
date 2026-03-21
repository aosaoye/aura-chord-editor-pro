import { NextResponse } from 'next/server';
import { Client } from "genius-lyrics";
import * as cheerio from "cheerio";

const genius = new Client();

const fetchFromLetras = async (query: string): Promise<string | null> => {
   try {
     // 1. Query DuckDuckGo for the song on letras.com specifically
     const duckUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent('site:letras.com ' + query)}`;
     const duckRes = await fetch(duckUrl, { 
       headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
       cache: 'no-store'
     });
     
     const duckHtml = await duckRes.text();
     const $ = cheerio.load(duckHtml);
     
     // Extract first Letras link from DuckDuckGo results
     const resultUrl = $('.result__url').first().attr('href');
     if (!resultUrl) return null;
     
     const params = new URLSearchParams(resultUrl.split('?')[1]);
     let letrasLink = params.get('uddg');
     if (!letrasLink) letrasLink = resultUrl; // Sometimes returns it directly
     
     if (!letrasLink.includes('letras.com')) return null;

     // 2. Fetch Letras.com page
     const letrasRes = await fetch(letrasLink, { 
       headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
       cache: 'no-store'
     });
     
     const letrasHtml = await letrasRes.text();
     const $$ = cheerio.load(letrasHtml);
     
     // 3. Extract Lyrics container (Letras uses 'lyric-original' or 'lyric')
     const lyricDiv = $$('.lyric-original').length > 0 
        ? $$('.lyric-original').first() 
        : $$('.lyric').first();

     if (!lyricDiv || lyricDiv.length === 0) return null;

     // 4. Preserve line breaks, remove raw HTML tags
     let htmlText = lyricDiv.html() || "";
     htmlText = htmlText.replace(/<br\s*[\/]?>/gi, "\n"); // Convert <br> to \n
     htmlText = htmlText.replace(/<\/p>/gi, "\n\n");     // Convert </p> to double \n
     htmlText = htmlText.replace(/<[^>]+>/g, "");       // Remove remaining tags

     return htmlText;
   } catch (e) {
     console.error("Error scraping Letras:", e);
     return null;
   }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Falta parámetro de búsqueda (q)' }, { status: 400 });
  }

  try {
    // === MULTI-ENGINE SCRAPING ARCHITECTURE ===

    // INTENTO 1: DuckDuckGo -> Letras.com Proxy Scraper (Perfecto para la Música Hispana / Cristiana)
    const letrasLyrics = await fetchFromLetras(q);
    if (letrasLyrics && letrasLyrics.trim().length > 10) {
       return NextResponse.json({ 
          title: q.split('-')[0] || q,
          artist: "Letras.com Scraper",
          lyrics: letrasLyrics.trim()
       });
    }

    // INTENTO 2: Genius API Engine (Perfecto en Inglés y Pop Global)
    const searches = await genius.songs.search(q);
    
    if (searches.length === 0) {
      return NextResponse.json({ error: 'Sin resultados en Web Scrapers' }, { status: 404 });
    }

    // Seleccionamos el Mejor Match
    const firstSong = searches[0];
    const lyrics = await firstSong.lyrics();
    
    if (!lyrics || lyrics.trim().length === 0) {
         return NextResponse.json({ error: 'Letra vacía en el documento HTML' }, { status: 404 });
    }

    return NextResponse.json({ 
      title: firstSong.title,
      artist: firstSong.artist.name,
      lyrics: lyrics.trim()
    });

  } catch (error: any) {
    console.error("Engines Error:", error.message);
    return NextResponse.json({ error: 'Aura Lyrics Engine Offline' }, { status: 500 });
  }
}
