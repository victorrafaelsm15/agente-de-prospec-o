import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-lg border border-border-strong bg-white px-3 text-sm text-foreground placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:bg-slate-50 disabled:text-slate-400";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldBase, "h-10", className)} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldBase, "py-2 resize-none", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cn(fieldBase, "h-10 pr-8 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%236b6b76%22><path fill-rule=%22evenodd%22 d=%22M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z%22 clip-rule=%22evenodd%22/></svg>')] bg-no-repeat bg-[right_0.6rem_center]", className)} {...props} />
  )
);
Select.displayName = "Select";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-[13px] font-medium text-foreground", className)}
      {...props}
    />
  );
}
