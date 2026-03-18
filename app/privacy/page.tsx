import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import GsapWrapper from "../components/GsapWrapper";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pt-24">
      <Navbar variant="border" />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-20">
        <GsapWrapper animationType="fade-up">
          <h1 className="text-4xl font-black mb-8 italic tracking-tighter">Política de Privacidad</h1>
          <div className="prose prose-invert max-w-none text-muted-foreground space-y-6">
            <p className="text-sm">Última actualización: Marzo 2026</p>
            <h2 className="text-xl font-bold text-foreground">1. Recopilación de Información</h2>
            <p>Recopilamos información básica durante su registro (email, nombre) a través de Clerk, así como los datos de sus creaciones musicales (acordes, letras) en nuestra base de datos en Neon. No compartimos su correo electrónico con terceros para fines publicitarios.</p>
            <h2 className="text-xl font-bold text-foreground">2. Uso de Datos Financieros</h2>
            <p>Sus datos financieros, métodos de pago o cobro, son administrados de manera cifrada exclusivamente a través de Stripe y Stripe Connect. AuraChords no almacena información directa sobre tarjetas o cuentas bancarias completas.</p>
            <h2 className="text-xl font-bold text-foreground">3. Transparencia</h2>
            <p>Las obras marcadas como Públicas estarán a disposición de toda la comunidad musical. Usted conserva la propiedad intelectual completa de sus transcripciones originales.</p>
            <h2 className="text-xl font-bold text-foreground">4. Contacto y Eliminación</h2>
            <p>Si desea eliminar toda su cuenta, sus obras, o consultar sus datos guardados, por favor póngase en contacto a nuestro correo de soporte técnico: 22.osaoye@gmail.com</p>
          </div>
        </GsapWrapper>
      </main>
      <Footer />
    </div>
  );
}
