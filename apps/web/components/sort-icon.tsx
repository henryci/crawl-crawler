"use client";

import { ChevronUp, ChevronDown } from "lucide-react";

interface SortIconProps {
  /** Whether this column is currently sorted */
  active: boolean;
  /** Current sort direction */
  direction: "asc" | "desc";
}

/**
 * Sort indicator icon for sortable table headers.
 */
export function SortIcon({ active, direction }: SortIconProps) {
  if (!active) return null;

  return direction === "asc" ? (
    <ChevronUp className="w-3 h-3 inline ml-1" />
  ) : (
    <ChevronDown className="w-3 h-3 inline ml-1" />
  );
}

