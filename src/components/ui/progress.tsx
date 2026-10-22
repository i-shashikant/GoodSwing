import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return <div className={cn("h-2 overflow-hidden rounded-full bg-neutral-100", className)}><div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}
