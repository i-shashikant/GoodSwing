import type { ReactNode } from "react";

export function Calligraphy({ children }: { children: ReactNode }) {
  return (
    <span
      className="font-serif font-normal italic tracking-[-0.03em] text-emerald-300"
      style={{ fontFamily: '"Brush Script MT", "Segoe Script", cursive' }}
    >
      {children}
    </span>
  );
}
