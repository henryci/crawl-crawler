import { AlertCircle } from "lucide-react";

type AlertVariant = "health" | "gold" | "mana" | "special" | "destructive";

interface AlertBannerProps {
  title: string;
  message: string;
  variant?: AlertVariant;
}

const variantStyles: Record<AlertVariant, string> = {
  health: "bg-health/10 border-health/20 [&_svg]:text-health [&_.alert-title]:text-health",
  gold: "bg-gold/10 border-gold/20 [&_svg]:text-gold [&_.alert-title]:text-gold",
  mana: "bg-mana/10 border-mana/20 [&_svg]:text-mana [&_.alert-title]:text-mana",
  special: "bg-special/10 border-special/20 [&_svg]:text-special [&_.alert-title]:text-special",
  destructive: "bg-destructive/10 border-destructive/20 [&_svg]:text-destructive [&_.alert-title]:text-destructive",
};

/**
 * Reusable alert/notice banner component.
 * Used for "Coming Soon" notices and other informational messages.
 */
export function AlertBanner({ title, message, variant = "mana" }: AlertBannerProps) {
  return (
    <div className={`mb-6 flex items-start gap-2 p-4 rounded-md border ${variantStyles[variant]}`}>
      <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
      <div className="text-sm">
        <p className="alert-title font-medium">{title}</p>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

