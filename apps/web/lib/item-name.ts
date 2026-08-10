/**
 * Strip the leading article and trailing slot marker from an item's
 * raw morgue text for display ("a +2 ring of Foo (left hand)" →
 * "+2 ring of Foo"). Shared by the Equipment view and the Stat
 * Explorer so the same item never renders under two different names.
 */
export function cleanItemName(raw: string): string {
  return raw
    .replace(/^the\s+/i, "")
    .replace(/^a\s+/i, "")
    .replace(/^an\s+/i, "")
    .replace(/^cursed\s+/i, "")
    .replace(/\s*\([^)]+\)\s*$/g, "")
    .trim();
}
