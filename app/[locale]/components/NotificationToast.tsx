"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getPusherClient } from "@/lib/pusherClient";

type Notification = {
  id: string;
  type: string;
  message: string;
  link?: string;
  metadata?: any;
};

export default function NotificationToast() {
  const { user, isLoaded } = useUser();
  const [toast, setToast] = useState<Notification | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = `user-${user.id}`;
    const channel = pusher.subscribe(channelName);

    channel.bind("new_notification", (data: { notification: Notification }) => {
      setToast(data.notification);
      // Ocultar despues de 5 segundos
      setTimeout(() => setToast(null), 5000);
    });

    return () => {
      pusher.unsubscribe(channelName);
    };
  }, [user, isLoaded]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700 text-white p-4 rounded-xl shadow-2xl flex items-start gap-4 max-w-sm w-full relative overflow-hidden">
        {/* Decorative stripe */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
        
        <div className="flex-1">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
            {toast.type === "like" ? "Nuevo Favorito" : toast.type === "follow" ? "Nuevo Seguidor" : "Venta Premium"}
          </p>
          <p className="text-sm leading-tight text-gray-200">
            {toast.message}
          </p>
        </div>
        
        <button 
          onClick={() => setToast(null)}
          className="text-gray-500 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
