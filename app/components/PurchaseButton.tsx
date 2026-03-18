"use client";

import { useState } from "react";

export default function PurchaseButton({ songId, price }: { songId: string, price: number }) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/marketplace/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId })
      });

      const data = await res.json();
      
      if (!res.ok) {
        alert("⚠️ " + data.error);
        setIsLoading(false);
        return;
      }
      
      alert(data.message);
      window.location.reload(); // Recarga para desbloquear la canción completamente
    } catch (e) {
      console.error(e);
      alert("Error procesando pago.");
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handlePurchase}
      disabled={isLoading}
      className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold tracking-[0.1em] uppercase hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(var(--primary-raw),0.3)] flex items-center gap-3 w-full justify-center disabled:opacity-50"
    >
      <span className="text-lg">💶</span> {isLoading ? "Procesando..." : `Comprar Permanente • €${price.toFixed(2)}`}
    </button>
  );
}
