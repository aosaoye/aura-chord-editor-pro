
interface CustomButtonProps {
  onClick: () => void;
  text: string;
  icon: React.ReactNode;
}

export function CustomButton({ onClick, text, icon }: CustomButtonProps) {
  return <button
    className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
    onClick={onClick}
  >
    {text}
    {icon}
  </button>;
}
