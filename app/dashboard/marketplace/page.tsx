import Link from "next/link";
import { LayoutDashboard, Settings, Info, CreditCard, Wallet, AlertTriangle, TrendingUp, Music } from "lucide-react";
import Navbar from "../../components/Navbar";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import GsapWrapper from "../../components/GsapWrapper";
import ConnectStripeButton from "../../components/ConnectStripeButton";

import { Prisma } from "@prisma/client";

const prisma = db;

type SaleWithDetails = Prisma.PurchaseGetPayload<{
  include: { 
    song: { select: { title: true } };
    user: { select: { name: true; email: true } };
  };
}>;

type DbUser = Prisma.UserGetPayload<{}>;

export default async function MarketplaceDashboardPage() {
  const { currentUser } = await import("@clerk/nextjs/server");
  const user = await currentUser();
  const userId = user?.id;

  let dbUser: DbUser | null = null;
  let sales: SaleWithDetails[] = [];
  let totalRevenue = 0;

  if (userId) {
    dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    
    // Buscar ventas: Compras hechas por otros sobre mis canciones
    if (dbUser) {
      sales = await db.purchase.findMany({
        where: { song: { userId } },
        include: { 
          song: { select: { title: true } }, 
          user: { select: { name: true, email: true } } 
        },
        orderBy: { createdAt: "desc" },
      });

      totalRevenue = sales.reduce((acc: number, curr) => acc + curr.amount, 0);
    }
  }

  // Verificar si es un Creador Pro (Simulamos: si tiene stripeSubscriptionId o stripePriceId y quiere vender)
  // En la vida real, requiere un Plan Creador específico. Aquí pedimos cualquier suscripción de pago o conectarse explícitamente.
  const isCreatorPro = dbUser?.stripeSubscriptionId != null;
  const hasStripeConnect = dbUser?.stripeConnectAccountId != null;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden transition-colors duration-500 flex flex-col pt-[72px]">
      <Navbar variant="border" />
      
      <div className="flex flex-1 w-full max-w-[1600px] mx-auto overflow-hidden">
        
        {/* Sidebar Vertical */}
        <aside className="hidden md:flex flex-col w-64 border-r border-border bg-background p-6 gap-8">
           <div className="flex flex-col gap-2">
             <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-2">Mi Espacio</p>
             <Link href="/dashboard" className="flex items-center gap-3 text-sm font-medium p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-muted-foreground hover:text-foreground transition-colors group">
               <LayoutDashboard size={18} className="group-hover:text-primary transition-colors" />
               Visión General
             </Link>
          </div>

          <div className="flex flex-col gap-2">
             <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-2">Ajustes</p>
             <Link href="/dashboard/marketplace" className="flex items-center gap-3 text-sm font-semibold p-3 rounded-lg bg-primary/10 text-primary transition-colors group">
               <span className="text-lg">💳</span>
               Marketplace (Ventas)
             </Link>
             <Link href="/settings" className="flex items-center gap-3 text-sm font-medium p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-muted-foreground hover:text-foreground transition-colors group">
               <Settings size={18} className="group-hover:text-primary transition-colors" />
               Configuración
             </Link>
          </div>
        </aside>

        {/* Main Content Marketplace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12 relative flex flex-col">
           
           <GsapWrapper animationType="fade-in" duration={1}>
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground flex items-center gap-4">
                    Centro de <span className="font-bold">Creadores</span>
                  </h1>
                  <p className="text-muted-foreground mt-2 font-medium">Gestiona tu método de cobro, ventas y ganancias por tus partituras premium.</p>
                </div>
             </div>
           </GsapWrapper>

           {!isCreatorPro ? (
              <GsapWrapper animationType="scale-up" delay={0.2} className="w-full flex-1 flex flex-col items-center justify-center text-center p-8 border border-border bg-muted/30 rounded-3xl min-h-[50vh]">
                 <AlertTriangle size={64} className="text-primary/70 mb-6" />
                 <h2 className="text-3xl font-black mb-4">Requiere Plan Creador PRO</h2>
                 <p className="text-muted-foreground max-w-lg mb-8 leading-relaxed">
                   Para vender obras y asignarles un precio en AuraChords, necesitas estar suscrito al nivel superior para creadores y certificar tu cuenta.
                 </p>
                 <Link href="/pricing" className="bg-primary text-primary-foreground px-10 py-5 rounded-full font-bold tracking-[0.1em] uppercase hover:scale-105 transition-all shadow-xl">
                    Actualizar a PRO
                 </Link>
              </GsapWrapper>
           ) : (
             <>
               <GsapWrapper animationType="stagger-children" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12" delay={0.2}>
                 
                 {/* Card Ganancias */}
                 <div className="bg-background border border-border rounded-3xl p-6 flex flex-col shadow-sm relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all"></div>
                   <p className="text-muted-foreground font-semibold text-sm flex items-center gap-2 relative z-10"><TrendingUp size={16}/> Total Ganancias Generadas</p>
                   <h3 className="text-5xl font-bold tracking-tighter mt-4 relative z-10">€{totalRevenue.toFixed(2)}</h3>
                 </div>

                 {/* Card Ventas */}
                 <div className="bg-background border border-border rounded-3xl p-6 flex flex-col shadow-sm relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all"></div>
                   <p className="text-muted-foreground font-semibold text-sm flex items-center gap-2 relative z-10"><CreditCard size={16}/> Partituras Vendidas</p>
                   <h3 className="text-5xl font-bold tracking-tighter mt-4 relative z-10">{sales.length}</h3>
                 </div>

                 {/* Card Cuenta Vinculada */}
                 <div className={`border rounded-3xl p-6 flex flex-col shadow-sm relative overflow-hidden transition-colors ${hasStripeConnect ? 'bg-primary text-primary-foreground border-primary/20' : 'bg-destructive/10 border-destructive border-dashed border-2'}`}>
                   {hasStripeConnect ? (
                     <>
                        <p className="text-primary-foreground/70 font-semibold text-sm flex items-center gap-2 relative z-10"><Wallet size={16}/> Cobros Automáticos</p>
                        <h3 className="text-xl font-bold mt-4 relative z-10 mb-2">Cuenta Conectada ✔</h3>
                        <p className="text-xs opacity-80 z-10">Estás recibiendo los ingresos en tu cuenta bancaria puntualmente.</p>
                     </>
                   ) : (
                     <div className="flex flex-col h-full justify-between z-10 relative text-center items-center">
                        <h3 className="text-lg font-bold text-destructive mb-2">⚠️ Acción Requerida</h3>
                        <p className="text-xs text-muted-foreground mb-4">Debes conectar tu cuenta para recibir tus ganancias.</p>
                        <ConnectStripeButton />
                     </div>
                   )}
                 </div>

               </GsapWrapper>

               {/* Historial de Ventas */}
               <div className="w-full">
                  <h2 className="text-xl font-bold tracking-tight mb-6">Últimas Transacciones</h2>
                  
                  {sales.length === 0 ? (
                    <div className="w-full h-40 border border-border rounded-3xl flex flex-col items-center justify-center text-muted-foreground bg-accent/30">
                      <Music size={32} className="mb-3 opacity-30" />
                      <p className="font-semibold text-sm">Aún no hay ventas registradas.</p>
                    </div>
                  ) : (
                    <GsapWrapper animationType="stagger-children" delay={0.4} className="flex flex-col gap-4">
                      {sales.map((sale) => (
                        <div key={sale.id} className="bg-background border border-border rounded-2xl p-5 flex flex-wrap gap-4 items-center justify-between hover:border-primary/50 transition-colors">
                           <div className="flex flex-col">
                             <h4 className="font-bold text-foreground text-lg mb-1">{sale.song.title}</h4>
                             <p className="text-xs text-muted-foreground flex items-center gap-2">
                               <span>Comprador: {sale.user?.name || sale.user?.email || "Usuario Eliminado"}</span>
                               <span>•</span>
                               <span>{format(new Date(sale.createdAt), "d MMMM yyyy, HH:mm", { locale: es })}</span>
                             </p>
                           </div>
                           <div className="bg-green-500/10 text-green-600 dark:text-green-400 font-bold px-4 py-2 rounded-lg ml-auto">
                              + €{sale.amount.toFixed(2)}
                           </div>
                        </div>
                      ))}
                    </GsapWrapper>
                  )}
               </div>
             </>
           )}

        </main>
      </div>
    </div>
  );
}
