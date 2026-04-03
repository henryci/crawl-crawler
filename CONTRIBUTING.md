# Contributing

Thanks for your interest in improving Crawl Crawler.

## Where to report things

- **Bug reports:** use the **Bug report** issue form.
- **Feature requests:** use the **Feature request** issue form.
- **Usage questions:** use the **Question** issue form.

Please include clear reproduction steps, relevant package/app paths, and logs where possible.

## Development setup

From the repo root:

```bash
pnpm install
pnpm dev
```

For database-backed features, follow setup in `README.md` (`apps/web/.env`, migrations, and data loading commands).

## Pull requests

- Keep changes focused and scoped.
- Include tests when practical, especially for parser/database behavior.
- Run checks before opening a PR:

```bash
pnpm lint
```

If you change parser behavior, run relevant package tests (for example `pnpm test:parser`).

## Suggested labels

If maintainers are triaging manually, these are useful starters:

- `bug`
- `enhancement`
- `question`
- `documentation`
- `good first issue`
- `help wanted`
