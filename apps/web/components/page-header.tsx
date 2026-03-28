import type { LucideIcon } from "lucide-react";

type ColorVariant = "health" | "gold" | "mana" | "special";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  variant?: ColorVariant;
  action?: React.ReactNode;
}

const variantStyles: Record<ColorVariant, string> = {
  health: "bg-health/10 border-health/30 [&_svg]:text-health",
  gold: "bg-gold/10 border-gold/30 [&_svg]:text-gold",
  mana: "bg-mana/10 border-mana/30 [&_svg]:text-mana",
  special: "bg-special/10 border-special/30 [&_svg]:text-special",
};

export function PageHeader({ title, subtitle, icon: Icon, variant = "health", action }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-md border flex items-center justify-center ${variantStyles[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {action}
      </div>
    </div>
  );
}

