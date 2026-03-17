"use client";

import { useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";

export default function FollowButton({ userId, initialFollowing }: { userId: string, initialFollowing: boolean }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const toggleFollow = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setFollowing(data.following);
      }
    } catch (err) {
      console.error("Error al seguir:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFollow}
      disabled={loading}
      className={`px-8 py-4 rounded-full font-bold text-xs uppercase tracking-[0.2em] shadow-lg transition-all flex items-center gap-3 ${
        following
          ? "bg-muted text-foreground hover:bg-red-50 hover:text-red-500 hover:border-red-200 border border-transparent"
          : "bg-primary text-primary-foreground hover:scale-105 active:scale-95 shadow-[0_10px_20px_rgba(var(--primary-raw),0.3)] hover:bg-primary/90"
      }`}
    >
      {following ? (
        <>
          <UserCheck size={18} />
          {loading ? "Procesando..." : "Siguiendo (Dejar de seguir)"}
        </>
      ) : (
        <>
          <UserPlus size={18} />
          {loading ? "Procesando..." : "Seguir Compositor"}
        </>
      )}
    </button>
  );
}
