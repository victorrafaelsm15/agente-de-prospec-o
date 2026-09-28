import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand text-brand-foreground shadow-sm shadow-indigo-900/10 hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-900/15 hover:-translate-y-px active:translate-y-0 active:bg-indigo-800 active:shadow-sm disabled:bg-indigo-300 disabled:shadow-none disabled:translate-y-0",
  secondary:
    "bg-white text-foreground border border-border-strong shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-px active:translate-y-0 active:bg-slate-100 disabled:text-slate-400 disabled:bg-slate-50 disabled:translate-y-0 disabled:shadow-none",
  ghost:
    "text-foreground hover:bg-slate-100 active:bg-slate-200 disabled:text-slate-300 disabled:hover:bg-transparent",
  danger:
    "bg-danger text-white shadow-sm hover:bg-red-700 hover:shadow-md hover:-translate-y-px active:translate-y-0 active:bg-red-800 disabled:bg-red-300 disabled:translate-y-0 disabled:shadow-none",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-5 text-sm gap-2 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:pointer-events-none",
          "cursor-pointer",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
