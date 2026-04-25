import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border-2 border-gray-200 bg-transparent px-4 py-3 text-base placeholder:text-gray-400 focus:border-brand focus:outline-none",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
