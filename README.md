# arthur_tools

A collection of my Houdini Python scripts and VEX snippets. Built with Next.js 16 (App Router), Prisma + Postgres, Auth.js and Sass modules, the same stack as `review_website_nextjs`.

## Getting started

```bash
cp .env.example .env        # then set AUTH_SECRET (npx auth secret)
npm install
npm run compose             # starts Postgres on localhost:5433 and applies migrations
npm run create_admin -- <username> <password> "Your name"
npm run dev
```

Open http://localhost:3000. Sign in at `/login`, then add tools from `/admin`.

## Icons

Each tool can show a Houdini icon, a custom image, or nothing. A custom image takes priority.

- **Houdini icons:** run `npm run import_houdini_icons -- "C:\Program Files\Side Effects Software\Houdini 21.0.xxx"`. The path can be the Houdini install, its `houdini/config/Icons/icons.zip`, or an extracted copy. This renders the SVGs to 96px WebPs in `public/houdini-icons/` (about 20 MB instead of 175 MB of SVG). It also applies Houdini's `IconMapping` aliases, so names like `SOP_null` resolve the way they do in Houdini. Git ignores the folder because the icons are SideFX's artwork, but a local `docker build` still includes it. The admin form's picker stores names the way shelf tools do (`SOP_null`). Re-run it after upgrading Houdini.
- **Custom images:** upload PNG, JPEG, WebP or SVG (up to 5 MB) on the tool form. They're resized to a 128px WebP and stored in Postgres.

## Layout

- `prisma/schema/`: `Tool` (name, slug, language, context, code, tags, published flag) and `User`
- `src/app/`: public index (`/`, filter with `?lang=` and `?tag=`), tool pages (`/tools/[slug]`, raw download at `/tools/[slug]/raw`), `/login`, `/admin`
- `src/server/actions/`: server actions. Every mutation calls `requireAdmin()`.
- `src/lib/highlight/`: Shiki highlighting. Shiki has no VEX grammar, so `vex-grammar.ts` is a custom one.
- `src/lib/tool-language.ts`: per-language labels, highlight ids and file extensions. Add a new language here and in the `ToolLanguage` enum.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run lint` | ESLint + color-literal check + stylelint |
| `npm run format` | Biome format |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run prisma_migrate` | Create a migration after a schema change |
| `npm run studio` | Prisma Studio |

The Husky pre-commit hook runs lint and typecheck.

Colors live only as tokens in `src/app/styles/globals.sass`'s `:root`. `lint:colors` fails on hardcoded colors anywhere else.
