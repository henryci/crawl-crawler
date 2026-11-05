# Equipment Optimizer: unlisted until launch

As of 2026-10-28 the Equipment Optimizer is fully built and deployed but hidden
from navigation, so the blog post and data refresh could be announced without
it. This file records exactly what was hidden and how to put it back. Nothing
about the optimizer itself (panel, API, URL state, auto-run, tooltips) was
changed; only the entry points were removed.

The optimizer remains reachable by URL the whole time, so links can be tested
before relaunch:

- Sample character, maximise resistances (auto-runs on load):
  `/morgue?url=%2Fsamples%2Fsample-character.txt&tab=optimizer&obj=max-all-resist`
- Max AC while keeping rF+ and rC+:
  `/morgue?url=%2Fsamples%2Fsample-character.txt&tab=optimizer&obj=max-ac%2Cmax-all-resist&floors=rF%3A1%2CrC%3A1`
- Stat Explorer view:
  `/morgue?url=%2Fsamples%2Fsample-character.txt&tab=optimizer&obj=max-all-resist&view=stats`

## What was hidden, and how to reverse each change

### 1. Morgue page tab trigger
File: `apps/web/app/morgue/page.tsx`

The Optimizer `<TabsTrigger>` is wrapped in `{activeTab === "optimizer" && (...)}`
with a comment marking it as unlisted. To relaunch, remove the condition and the
comment so the trigger renders unconditionally, like the other four tabs. The
`<TabsContent value="optimizer">` block was never removed.

### 2. "Try a sample character" button
File: `apps/web/app/morgue/page.tsx`

Removed from the morgue URL form, together with its `handleLoadSample` handler
and the now-unused imports (`HelpTip`, `optimizerTooltips`, `SAMPLE_CHARACTER_URL`,
`morgueLink`). To restore, add back below the Parse row:

```tsx
<div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
  <span>No dump handy?</span>
  <Button
    variant="ghost"
    size="sm"
    onClick={() => router.push(morgueLink({ url: SAMPLE_CHARACTER_URL, tab: "optimizer" }), { scroll: false })}
    disabled={loadingState === "loading"}
    className="h-7 px-2 text-mana hover:text-mana hover:bg-mana/10"
  >
    Try a sample character
  </Button>
  <HelpTip text={optimizerTooltips.sample} />
</div>
```

and re-add the imports: `HelpTip` from `@/components/help-tip`,
`optimizerTooltips` from `@/lib/tooltips`, and `SAMPLE_CHARACTER_URL`,
`morgueLink` from `@/lib/links`. The sample file itself is still served at
`apps/web/public/samples/sample-character.txt`.

### 3. Morgue page guide text
File: `apps/web/app/morgue/page.tsx` (the `morgueGuide` constant)

Optimizer sentences were removed from four sections. Original wording to restore:

- **What is this?** append: "The Optimizer tab uses the parsed inventory to find
  your best legal equipment loadout against an objective you pick."
- **Loading a character dump** last sentence was: "Character dumps work with the
  Optimizer tab so you can plan equipment changes mid-run." (currently reads
  "Character dumps parse the same way, so you can review an ongoing game before
  deciding what to do next.")
- **Tips** second sentence was: "The Optimizer tab (0.33+ inventories only) lets
  you maximize objectives, add 'at least N' constraints, lock items you want to
  keep, and ban items you don't want suggested." (currently a sentence about the
  Dungeon tab)
- **Keep in mind** append: "The Optimizer specifically needs DCSS 0.33 or newer
  for its structured inventory data."

### 4. Example questions
File: `apps/web/lib/questions.ts`

The three optimizer questions (`optimizer-resists`, `optimizer-ac-with-floors`,
`optimizer-stat-explorer`) are still in the file with `unlisted: true`, which
`questionsForPage` and `featuredQuestions` filter out. To relaunch, delete the
`unlisted: true` line on each. `optimizer-resists` was previously `featured: true`
on the home page; `mibe-skills` was promoted to keep four featured questions, so
either demote it again or accept five.

### 5. Welcome blog post
File: `apps/web/content/blog/welcome.mdx`

The Morgue / Character Viewer paragraph previously read:

> **Morgue / Character Viewer** parses any morgue or in-progress character dump from a supported server
> and lays it out: overview, skills over time, dungeon progression. It also holds the **Equipment
> Optimizer**, which searches your whole inventory for the legal loadout that best meets an objective
> you choose, with "require at least" constraints, locked items, and banned items. It needs a 0.33 or
> newer dump, so there is a sample character to try it on. `<ViewLink href={morgueLink({ url: SAMPLE_CHARACTER_URL, optimizer: { priorities: ["max-all-resist"] } })}>Optimize a sample character</ViewLink>`

and the "How to use it" sentence was "Everything you set is in the page URL: the
filters, the tab, the grouping, the optimizer's objective and constraints."
Restoring both also needs `SAMPLE_CHARACTER_URL` added back to the post's
import from `@/lib/links`.

## Not changed

- `apps/web/components/optimizer-panel.tsx`: untouched, including its own
  "Copy link" button, first-visit hint, help tips, and the sample-character link
  inside the "missing inventory data" message (only visible on the tab itself).
- `apps/web/lib/tooltips.ts`: `tabHints.morgueOptimizer` and `optimizerTooltips`
  remain and are still used by the panel.
- `apps/web/lib/links.ts`: optimizer URL schema, `morgueLink`, `SAMPLE_CHARACTER_URL`.
- Background reading for the launch post: `EQUIPMENT_OPTIMIZER_KNOWLEDGE.md`.

## Relaunch checklist

1. Reverse items 1 to 5 above.
2. `pnpm lint` and `pnpm --filter @crawl-crawler/web build`.
3. Open the three links at the top and confirm the tab shows, the sample loads,
   and the first link auto-runs.
4. Delete this file.
