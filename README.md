# Crawl Crawler

A monorepo for DCSS (Dungeon Crawl Stone Soup) tools and utilities.

## Project Structure

```
crawl-crawler/
├── apps/
│   └── web/                    # Next.js web application
├── packages/
│   └── dcss-morgue-parser/     # Library for parsing DCSS morgue files
└── scripts/
    └── streak-downloader/      # Python script for downloading morgue files
```

## Getting Started

This project uses [pnpm](https://pnpm.io/) as its package manager with workspaces.

### Prerequisites

- Node.js >= 18
- pnpm >= 9

### Installation

```bash
pnpm install
```

### Development

```bash
# Run the web app in development mode
pnpm dev

# Build the web app
pnpm build

# Build the morgue parser library
pnpm build:parser

# Run parser tests
pnpm test:parser
```

## Packages

### @crawl-crawler/web

The main Next.js web application. Located in `apps/web/`.

### dcss-morgue-parser

A TypeScript library for parsing DCSS morgue files. Can be used as a library or via CLI. Located in `packages/dcss-morgue-parser/`.

```bash
# Use as CLI
pnpm --filter dcss-morgue-parser cli <morgue-file>
```

### streak-downloader

A Python script for downloading morgue files. Located in `scripts/streak-downloader/`.

See [scripts/streak-downloader/README.md](scripts/streak-downloader/README.md) for usage.

## Deployment

The web app can be deployed on Vercel. Configure the root directory to `apps/web` in your Vercel project settings.
