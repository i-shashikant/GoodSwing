import { cn } from "@/lib/utils";

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border border-black/[.08] bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold", className)}>{children}</span>;
}
