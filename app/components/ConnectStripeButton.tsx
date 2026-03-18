"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";

export default function ConnectStripeButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [showIBAN, setShowIBAN] = useState(false);
  const [iban, setIban] = useState("");

  const handleConnect = async () => {
    if (!iban.trim()) return;

    try {
      setIsLoading(true);
      const res = await fetch("/api/marketplace/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iban })
      });

      if (!res.ok) throw new Error("Error conectando cuenta");
      
      // Reload page to show connected state
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Hubo un error al vincular la cuenta bancaria.");
      setIsLoading(false);
    }
  };

  if (!showIBAN) {
    return (
      <button 
        onClick={() => setShowIBAN(true)}
        className="bg-foreground text-background w-full py-3 rounded-lg font-bold tracking-widest text-[10px] uppercase hover:opacity-80 transition-all flex items-center justify-center gap-2"
      >
        <Wallet size={14} />
        Conectar Cuenta Bancaria
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full mt-2">
      <input 
        type="text" 
        placeholder="Introduce tu IBAN (Ej. ES91 ...)" 
        value={iban}
        onChange={(e) => setIban(e.target.value)}
        className="w-full bg-background border border-border px-3 py-2 text-xs rounded-lg text-foreground focus:outline-none focus:border-primary transition-colors"
      />
      <div className="flex gap-2">
        <button 
          onClick={() => setShowIBAN(false)}
          className="flex-1 py-2 rounded-lg text-xs font-bold bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          Cancelar
        </button>
        <button 
          onClick={handleConnect}
          disabled={isLoading || !iban.trim()}
          className="flex-1 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? "Conectando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}
