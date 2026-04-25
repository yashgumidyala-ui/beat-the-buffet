"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  className?: string;
  ariaLabel?: string;
}

export function Switch({ checked, onCheckedChange, className, ariaLabel }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition",
        checked ? "bg-brand" : "bg-gray-300",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white transition shadow",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}
