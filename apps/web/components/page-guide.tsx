"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ColorVariant = "health" | "gold" | "mana" | "special";

export interface GuideSection {
  icon?: LucideIcon;
  title: string;
  content: React.ReactNode;
}

interface PageGuideProps {
  title: string;
  description: string;
  icon: LucideIcon;
  variant?: ColorVariant;
  sections: GuideSection[];
}

const variantButtonStyles: Record<ColorVariant, string> = {
  health: "border-health/40 text-health hover:bg-health/10",
  gold: "border-gold/40 text-gold hover:bg-gold/10",
  mana: "border-mana/40 text-mana hover:bg-mana/10",
  special: "border-special/40 text-special hover:bg-special/10",
};

const variantPulseStyles: Record<ColorVariant, string> = {
  health: "bg-health/30",
  gold: "bg-gold/30",
  mana: "bg-mana/30",
  special: "bg-special/30",
};

const variantAccentStyles: Record<ColorVariant, string> = {
  health: "text-health",
  gold: "text-gold",
  mana: "text-mana",
  special: "text-special",
};

export function PageGuide({
  title,
  description,
  icon: Icon,
  variant = "health",
  sections,
}: PageGuideProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setOpen(true)}
              className={`relative flex items-center justify-center w-8 h-8 rounded-full border bg-transparent transition-colors cursor-pointer ${variantButtonStyles[variant]}`}
              aria-label={`Guide: ${title}`}
            >
              <span
                className={`absolute inset-0 rounded-full pointer-events-none ${variantPulseStyles[variant]}`}
                style={{ animation: "guide-pulse 1.5s ease-in-out 3" }}
              />
              <CircleHelp className="w-4 h-4 relative" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Page guide</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${variantAccentStyles[variant]}`} />
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            {sections.map((section) => (
              <div key={section.title}>
                <h3
                  className={`text-sm font-semibold mb-1.5 flex items-center gap-1.5 ${variantAccentStyles[variant]}`}
                >
                  {section.icon && <section.icon className="w-3.5 h-3.5" />}
                  {section.title}
                </h3>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
