import { NextResponse } from 'next/server';
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
     const userId = await requireUser();
     
     const stream = new ReadableStream({
        async start(controller) {
           const encoder = new TextEncoder();
           let isStreamClosed = false;
           let interval: any;

           const sendNotifications = async () => {
              if (isStreamClosed) return;
              try {
                const notifications = await db.notification.findMany({
                   where: { userId },
                   orderBy: { createdAt: 'desc' },
                   take: 30
                });
                const data = JSON.stringify(notifications);
                try {
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                } catch (enqueueError) {
                  // The stream was closed by the client unexpectedly
                  isStreamClosed = true;
                  clearInterval(interval);
                }
              } catch (e) {
                console.error("SSE loop error", e);
              }
           };

           // Primera entrega instatánea
           await sendNotifications();
           // Pooling agresivo silencioso cada 3 segundos, NO emite logs en Vercel ni consola de Node (porque la request ya fue abierta con 200).
           interval = setInterval(sendNotifications, 3000); 

           request.signal.addEventListener('abort', () => {
              isStreamClosed = true;
              clearInterval(interval);
           });
        },
        cancel() {
           // handled by abort 
        }
     });

     return new NextResponse(stream, {
        headers: {
           'Content-Type': 'text/event-stream',
           'Cache-Control': 'no-cache, no-transform',
           'Connection': 'keep-alive'
        }
     });
  } catch (e) {
     return new NextResponse("Unauthorized", { status: 401 });
  }
}
