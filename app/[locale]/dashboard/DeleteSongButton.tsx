"use client";

import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

export default function DeleteSongButton({ songId }: { songId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConfirmClick = async () => {
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
      setShowModal(false);
    }
  };

  const handleInitDelete = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    setShowModal(true);
  };

  const closeModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDeleting) setShowModal(false);
  };

  const modalContent = showModal ? (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={closeModal}
    >
      <div 
        className="bg-background border border-border p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 text-center"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} />
        </div>
        <h3 className="text-xl font-bold mb-2">Eliminar Obra</h3>
        <p className="text-muted-foreground text-sm mb-6">
          ¿Seguro que deseas eliminar esta obra? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-center">
          <button 
            className="px-5 py-2.5 rounded-full border border-border bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900 font-semibold transition-colors"
            onClick={closeModal}
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button 
            className="px-5 py-2.5 rounded-full bg-red-500 text-white font-semibold flex items-center gap-2 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleConfirmClick(); }}
            disabled={isDeleting}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={handleInitDelete}
        disabled={isDeleting}
        className={`absolute bottom-4 right-4 z-20 p-2 rounded-full border border-border bg-background/50 backdrop-blur-sm transition-all shadow-sm ${
          isDeleting ? "opacity-50 cursor-not-allowed" : "hover:bg-red-500 hover:text-white hover:border-red-500 hover:scale-110 active:scale-95 text-muted-foreground"
        }`}
        title="Eliminar Obra"
      >
        <Trash2 size={16} />
      </button>

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
