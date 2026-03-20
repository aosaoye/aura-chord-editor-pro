export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Evitamos inicializar multiples veces en dev
    // @ts-ignore
    if (!globalThis.__worker_booted) {
      // @ts-ignore
      globalThis.__worker_booted = true;
      console.log("🚀 Iniciando Worker de BullMQ localmente (Node Runtime)...");
      const { createNotificationWorker } = await import("./workers/notification.worker");
      
      // DESACTIVADO TEMPORALMENTE PARA EVITAR CONGELAMIENTOS:
      // Cuando Redis falla por firewall, bloquea el Event Loop de tu Next.js
      // createNotificationWorker(); 
    }
  }
}
