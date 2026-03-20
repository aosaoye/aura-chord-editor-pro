export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Evitar iniciar multiples workers en caso de HMR (Fast Refresh)
    // @ts-ignore
    if (!globalThis.__worker_booted) {
      console.log("🚀 Iniciando Worker de BullMQ localmente (Node Runtime)...");
      const { createNotificationWorker } = await import("./workers/notification.worker");
      createNotificationWorker();
      // @ts-ignore
      globalThis.__worker_booted = true;
    }
  }
}
