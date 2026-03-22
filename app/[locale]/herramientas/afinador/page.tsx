"use client";

import GuitarTuner from '../../components/GuitarTuner';
import { useRouter } from 'next/navigation';

export default function AfinadorPage() {
  const router = useRouter();
  
  return (
    <main className="w-full flex-1 min-h-[100svh] bg-[#0A0C10] overflow-hidden p-0 m-0 relative">
      <GuitarTuner 
        isStandalone={true} 
        onClose={() => router.push('/herramientas')} 
      />
    </main>
  );
}
