import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "success";
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "default", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "bg-emerald-600 text-white shadow-lg shadow-emerald-950/10 hover:-translate-y-0.5 hover:bg-emerald-500",
        variant === "success" && "bg-[#f0c95b] text-[#173f2d] shadow-lg shadow-amber-950/10 hover:-translate-y-0.5 hover:bg-[#f6d778]",
        variant === "outline" && "border border-black/10 bg-white/70 text-neutral-900 hover:-translate-y-0.5 hover:bg-white hover:shadow-md",
        variant === "ghost" && "text-neutral-600 hover:bg-black/[.04] hover:text-neutral-950",
        size === "sm" && "px-3 py-2 text-xs",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-6 py-3.5 text-sm",
        className
      )}
      {...props}
    />
  );
}
