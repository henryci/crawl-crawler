"use client";

import { useState, useMemo, useCallback } from "react";

type SortDirection = "asc" | "desc";

interface UseSortableOptions<T, K extends keyof T> {
  /** Initial field to sort by */
  initialField: K;
  /** Initial sort direction */
  initialDirection?: SortDirection;
  /** Custom comparator function (optional) */
  comparator?: (a: T[K], b: T[K], direction: SortDirection) => number;
}

interface UseSortableReturn<T, K extends keyof T> {
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
export function useSortable<T extends Record<string, unknown>, K extends keyof T>(
  data: T[],
  options: UseSortableOptions<T, K>
): UseSortableReturn<T, K> {
  const { initialField, initialDirection = "asc", comparator } = options;

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

      if (comparator) {
        return comparator(aVal, bVal, sortDir);
      }

      return defaultComparator(aVal, bVal, sortDir);
    });
    return sorted;
  }, [data, sortField, sortDir, comparator]);

  const isSortedBy = useCallback((field: K) => field === sortField, [sortField]);

  return {
    sortedData,
    sortField,
    sortDir,
    handleSort,
    isSortedBy,
  };
}

