"use client";

import { useState } from "react";
import { Globe, Lock } from "lucide-react";

export default function PublicToggle({ songId, initialIsPublic }: { songId: string, initialIsPublic: boolean }) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [loading, setLoading] = useState(false);

  const toggleVisibility = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating if this is inside a Link wrapper
    
    setLoading(true);
    try {
      const res = await fetch(`/api/songs/${songId}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !isPublic }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsPublic(data.isPublic);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={toggleVisibility}
      disabled={loading}
      className={`absolute top-4 right-4 z-20 p-2 rounded-full backdrop-blur-md shadow-sm transition-all focus:outline-none 
        ${isPublic ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:scale-110' : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-110'}`}
      title={isPublic ? "Pública (Ocultar)" : "Privada (Hacer pública)"}
    >
      {isPublic ? <Globe size={16} /> : <Lock size={16} />}
    </button>
  );
}
