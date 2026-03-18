import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import GsapWrapper from "../components/GsapWrapper";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pt-24">
      <Navbar variant="border" />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-20">
        <GsapWrapper animationType="fade-up">
          <h1 className="text-4xl font-black mb-8 italic tracking-tighter">Términos del Servicio</h1>
          <div className="prose prose-invert max-w-none text-muted-foreground space-y-6">
            <p className="text-sm">Última actualización: Marzo 2026</p>
            <h2 className="text-xl font-bold text-foreground">1. Aceptación de los Términos</h2>
            <p>Al acceder o utilizar AuraChords, aceptas estar sujeto a estos términos y condiciones. Si no estás de acuerdo, por favor no utilices la plataforma.</p>
            <h2 className="text-xl font-bold text-foreground">2. Derechos de Autor y Propiedad</h2>
            <p>Todas las transcripciones y obras creadas en AuraChords por los usuarios registrados pertenecen a sus respectivos autores. AuraChords actúa únicamente como plataforma de intermediación tecnológica y mercado de acordes.</p>
            <h2 className="text-xl font-bold text-foreground">3. Marketplace y Transacciones</h2>
            <p>AuraChords utiliza Stripe Connect para transacciones seguras. La plataforma retiene una pequeña comisión administrativa detallada en la sección de Planes(Pro). Las obras Premium no pueden ser compartidas externamente sin permiso de su creador.</p>
            <h2 className="text-xl font-bold text-foreground">4. Limitación de Responsabilidad</h2>
            <p>El servicio se provee "tal cual". AuraChords no garantiza que el acceso será ininterrumpido o que no tendrá fallos. Nos reservamos el derecho de modificar el servicio bajo previo aviso limitado.</p>
          </div>
        </GsapWrapper>
      </main>
      <Footer />
    </div>
  );
}
