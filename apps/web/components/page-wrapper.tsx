import type { ReactNode } from "react";

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * Shared page wrapper with texture overlay and consistent layout.
 * Used across all pages for consistent styling.
 */
export function PageWrapper({ children, className = "" }: PageWrapperProps) {
  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <div className="absolute inset-0 texture-noise pointer-events-none" />
      <div className={`relative mx-auto max-w-7xl px-4 py-12 lg:px-8 ${className}`}>
        {children}
      </div>
    </div>
  );
}

