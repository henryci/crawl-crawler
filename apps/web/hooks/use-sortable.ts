"use client";

import { useState, useMemo, useCallback } from "react";

type SortDirection = "asc" | "desc";

interface UseSortableOptions<K> {
  /** Initial field to sort by */
  initialField: K;
  /** Initial sort direction */
  initialDirection?: SortDirection;
}

interface UseSortableReturn<T, K> {
  /** Currently sorted data */
  sortedData: T[];
  /** Current sort field */
  sortField: K;
  /** Current sort direction */
  sortDir: SortDirection;
  /** Handle clicking on a sortable column header */
  handleSort: (field: K) => void;
  /** Check if a field is the current sort field */
  isSortedBy: (field: K) => boolean;
}

/**
 * Default comparator for sorting values.
 * Handles numbers and strings appropriately.
 */
function defaultComparator<T>(a: T, b: T, direction: SortDirection): number {
  if (typeof a === "number" && typeof b === "number") {
    return direction === "asc" ? a - b : b - a;
  }
  const strA = String(a);
  const strB = String(b);
  return direction === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
}

/**
 * Hook for managing sortable table state.
 * Provides sorted data, sort state, and handlers.
 *
 * @example
 * ```tsx
 * const { sortedData, sortField, sortDir, handleSort, isSortedBy } = useSortable(
 *   data,
 *   { initialField: "score", initialDirection: "desc" }
 * );
 * ```
 */
export function useSortable<T, K extends keyof T>(
  data: T[],
  options: UseSortableOptions<K>
): UseSortableReturn<T, K> {
  const { initialField, initialDirection = "asc" } = options;

  const [sortField, setSortField] = useState<K>(initialField);
  const [sortDir, setSortDir] = useState<SortDirection>(initialDirection);

  const handleSort = useCallback(
    (field: K) => {
      if (field === sortField) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir(initialDirection);
      }
    },
    [sortField, initialDirection]
  );

  const sortedData = useMemo(() => {
    const sorted = [...data];
    sorted.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      return defaultComparator(aVal, bVal, sortDir);
    });
    return sorted;
  }, [data, sortField, sortDir]);

  const isSortedBy = useCallback((field: K) => field === sortField, [sortField]);

  return {
    sortedData,
    sortField,
    sortDir,
    handleSort,
    isSortedBy,
  };
}

