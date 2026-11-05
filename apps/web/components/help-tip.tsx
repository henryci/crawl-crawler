"use client";

import { useState, type ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTipProps {
  text: ReactNode;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
}

/**
 * A small "?" icon that explains one control on hover, focus, or tap. Use
 * it next to a label whose meaning isn't obvious from the label alone.
 */
export function HelpTip({ text, className, side = "top" }: HelpTipProps) {
  // Radix tooltips open only on hover and keyboard focus, and close on
  // click, so on a touch screen they never appear. Owning `open` lets a
  // click (a tap) open the tip too; tapping elsewhere dismisses it.
  const [open, setOpen] = useState(false);
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="What is this?"
            onClick={(event) => {
              // preventDefault skips Radix's close-on-click handler.
              event.preventDefault();
              setOpen(true);
            }}
            className={cn(
              "inline-flex items-center justify-center align-middle text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:text-foreground cursor-help",
              className,
            )}
          >
            <CircleHelp className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs text-xs leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
