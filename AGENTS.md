# Repository Guide

## Toolchain

- This is one private ESM Nuxt 4 package, not a monorepo; `pnpm-workspace.yaml` provides catalogs, build allowlists, and dependency patches rather than workspace package globs.
- Use the pinned `pnpm@11.21.0` with Node `^22.18 || ^23.6 || >=24`; `engineStrict` is enabled.
- `pnpm i` runs the `prepare` lifecycle. Run `pnpm prepare` after a clean checkout or when generated Nuxt metadata/types are stale; it deletes `.data` and `node_modules/.cache` before `nuxt prepare`.
- Never run `pnpm init-project` as setup or verification: after confirmation it deletes and recreates `content/`, rewrites `app/app.config.ts` and `blog.config.ts`, and replaces `redirects.json`.
- Do not use `pnpm bump` for verification; it updates dependency ranges, invokes `pnpm clean --lockfile`, and reinstalls.

## Commands

- Development: `pnpm dev`; expose on the LAN with `pnpm dev:host`.
- Deployment-style verification: `pnpm generate`; preview generated output with `pnpm preview`. `pnpm build` is the SSR build.
- Full lint: `pnpm lint` (ESLint, then Stylelint for all Vue/SCSS files). `pnpm lint:fix` applies broad repository-wide fixes.
- Focus one changed file with `pnpm exec eslint path/to/file.ts`, `pnpm exec eslint path/to/component.vue`, or `pnpm exec stylelint "path/to/component.vue"`.
- There is no test script, test runner, CI workflow, or configured typecheck command. Use focused lint for local changes and `pnpm generate` for content-schema, routing, server, or build-config changes.
- `pnpm check:feed` and `pnpm check:feed/all` make network requests; the all-feeds command runs up to 50 checks concurrently and writes ignored reports under `logs/`.

## Structure

- Nuxt application code and the root component live under `app/`; Nitro handlers live under `server/`; code shared by app and server lives under `shared/`.
- `blog.config.ts` holds configuration needed while Nuxt starts/builds. `app/app.config.ts` copies it into reactive app config and adds runtime UI/layout options; preserve this split.
- `content.config.ts` defines the sole Nuxt Content collection. The catch-all `app/pages/[...slug].vue` is the article renderer; article list queries and sorting are centralized in `app/composables/useArticle.ts`.
- Components under `app/components/partial/` are auto-imported with a `Z` prefix; other components use normal Nuxt auto-import names.
- Custom Markdown transforms are in `remark-plugins/` and are registered by file URL in `nuxt.config.ts`. Dependency behavior is also changed by the three active patches listed in `pnpm-workspace.yaml`; edit the patch/configuration rather than generated dependency files.

## Content And Routing

- A frontmatter `permalink` replaces the generated content path. Otherwise `blogConfig.article.hidePostPrefix` removes `/posts` from public URLs; do not infer public routes from content filenames alone.
- `draft` defaults to `false`, but current page, index, Atom, and stats queries do not filter drafts. `draft: true` does not make an article private or unpublished.
- `content/previews/**` is excluded from robots only; preview content remains queryable and renderable.
- Dates without an explicit zone are interpreted in `blogConfig.timeZone` by `shared/utils/time.ts`.
- `/api/stats`, `/atom.xml`, and `/subscriptions.opml` are prerendered through `nuxt.config.ts`. If an API path changes for EdgeOne deployment, update `edgeone.json` as well.

## Formatting And Generated Files

- Source uses tabs and LF; Markdown, JSON, and YAML use two spaces. Vue script blocks are TypeScript/TSX and style blocks are SCSS. JSON outside `content/` is linted without a final newline.
- Global SCSS entrypoints are declared in `nuxt.config.ts`; `_variable.scss` is injected automatically into every SCSS block.
- Do not edit or commit `.nuxt`, `.output`, `.data`, `.nitro`, `.cache`, `dist`, `node_modules`, or `logs`. Root `tsconfig.json` only references generated `.nuxt` configs.
