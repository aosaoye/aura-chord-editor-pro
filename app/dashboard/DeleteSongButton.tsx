"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteSongButton({ songId }: { songId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevents navigating to /editor if it's inside a Link
    e.stopPropagation();

    if (!confirm("¿Seguro que deseas eliminar esta obra? Esta acción no se puede deshacer.")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/songs?id=${songId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Error al eliminar la obra");
      }
    } catch (error) {
      console.error(error);
      alert("Error de red al intentar eliminar la obra");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`absolute bottom-4 right-4 z-20 p-2 rounded-full border border-border bg-background/50 backdrop-blur-sm transition-all shadow-sm ${
        isDeleting ? "opacity-50 cursor-not-allowed" : "hover:bg-red-500 hover:text-white hover:border-red-500 hover:scale-110 active:scale-95 text-muted-foreground"
      }`}
      title="Eliminar Obra"
    >
      <Trash2 size={16} />
    </button>
  );
}
