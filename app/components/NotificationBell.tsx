"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenDropdown = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // Mark as read
      try {
        await fetch("/api/notifications", { method: "PATCH" });
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch (e) {
         console.error(e);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleOpenDropdown}
        className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors relative"
      >
        <Bell size={20} className="text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full animate-pulse border-2 border-background"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute -right-16 sm:right-0 top-full mt-2 w-[280px] sm:w-80 max-h-[400px] overflow-y-auto bg-background border border-border rounded-2xl shadow-2xl z-50 flex flex-col hide-scrollbar p-2">
           <div className="p-3 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
             <h3 className="text-xs font-bold tracking-widest uppercase">Notificaciones</h3>
           </div>
           
           <div className="flex flex-col gap-1 p-2">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground opacity-70">
                   No tienes notificaciones
                </div>
              ) : (
                notifications.map(notif => (
                  notif.link ? (
                    <Link key={notif.id} href={notif.link} className={`p-3 rounded-xl hover:bg-muted transition-colors flex flex-col gap-1 ${!notif.read ? 'bg-primary/5' : ''}`} onClick={() => setIsOpen(false)}>
                       <p className={`text-xs ${!notif.read ? 'font-bold' : 'text-muted-foreground'}`}>{notif.message}</p>
                       <span className="text-[9px] text-muted-foreground font-bold tracking-widest uppercase opacity-70">
                         {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                       </span>
                    </Link>
                  ) : (
                    <div key={notif.id} className={`p-3 rounded-xl flex flex-col gap-1 ${!notif.read ? 'bg-primary/5' : ''}`}>
                       <p className={`text-xs ${!notif.read ? 'font-bold' : 'text-muted-foreground'}`}>{notif.message}</p>
                       <span className="text-[9px] text-muted-foreground font-bold tracking-widest uppercase opacity-70">
                         {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                       </span>
                    </div>
                  )
                ))
              )}
           </div>
        </div>
      )}
    </div>
  );
}
