# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

Admin panel for **Ushuaia360** — a Wikilock-style mobile app for hiking trails in Ushuaia, Argentina. This repo is the web admin panel only (the mobile app is a separate project).

The admin panel allows staff to:
- Upload and manage hiking trails (senderos)
- Manage users
- Manage trail comments

**Backend:** Python + Quart (async Flask-like) at `../ushuaia360-backend`, running on port 5000. API prefix: `/api/v1`. Auth is not yet implemented on the backend.

**Responsibility:** This repo covers UI/UX design and frontend only.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

No test runner is configured yet.

## Stack

- **Next.js 16** with App Router (`src/app/`)
- **React 19** with React Compiler enabled (`reactCompiler: true` in `next.config.ts`)
- **TypeScript** with strict mode
- **Tailwind CSS v4** — all styling is custom utility-first, no component library
- **Geist** font family (loaded via `next/font/google`, CSS vars `--font-geist-sans` / `--font-geist-mono`)

## Architecture

All source code lives in `src/`. Path alias `@/*` maps to `./src/*`.

App Router structure:
- `src/app/layout.tsx` — root layout: fonts, globals.css, full admin layout with sidebar
- `src/app/globals.css` — global styles; Tailwind tokens via `@theme inline`
- `src/app/page.tsx` — dashboard home (stats + recent activity)
- `src/app/usuarios/page.tsx` — user management table
- `src/app/senderos/page.tsx` — trail management table
- `src/app/comentarios/page.tsx` — comment moderation (pending/approved sections)
- `src/components/admin/sidebar.tsx` — collapsible sidebar (client component, uses `usePathname`)

## Design system

Colors: `#3FA9F5` primary blue, `#FFFFFF` white, `#E65C00` accent orange for alerts/important.
- Active nav: `bg-[#EBF5FE] text-[#3FA9F5]`
- Alert/pending badges: `bg-[#FFF0E6] text-[#E65C00]`
- App background: `#F7F8FA`, cards: white with `border-[#EBEBEB]`
- Card border radius: `rounded-xl`
- Table header text: `text-[11px] font-medium uppercase tracking-wide text-gray-400`
- All styling custom Tailwind v4, no component library

## Styling conventions

Tailwind v4 utility-first, all custom. Design tokens defined in `globals.css` via `@theme inline`. Dark mode via `prefers-color-scheme` on CSS variables, not Tailwind's `dark:` class strategy.
