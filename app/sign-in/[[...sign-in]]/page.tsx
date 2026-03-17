import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground animate-in fade-in duration-1000">
      <div className="relative">
        {/* Decorative Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/20 blur-[100px] rounded-full -z-10 mix-blend-screen pointer-events-none"></div>
        <SignIn />
      </div>
    </div>
  );
}
