// MOCK TEMPORAL PARA QUE NO CRASHEE TU NEXT.JS POR CULPA DE REDISLABS (ETIMEDOUT)
// Esto simula la cola sin conectarse a Redis para que puedas programar sin que se cierre Vercel Dev.

export const notificationQueue = {
  add: async (name: string, payload: any) => {
    console.log(`[Queue Mock] Job '${name}' omitido porque Redis está desactivado.`);
    return true;
  }
} as any;
