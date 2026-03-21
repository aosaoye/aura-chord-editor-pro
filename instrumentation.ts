export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Redis y BullMQ desactivados en este entorno para evitar
    // bloqueos de ETIMEDOUT en el Event Loop de Next.js
    console.log("🚀 Worker de BullMQ/Redis desactivado (Mock Mode Activo).");
  }
}
