# Nexora POS

Standalone point-of-sale frontend. No workspace or sibling-project dependency — everything it needs lives in this folder.

## Stack

React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, TanStack Table, React Hook Form + Zod, Axios, Vitest.

## Setup

```bash
cp .env.example .env.local   # point VITE_API_BASE_URL at your backend
pnpm install
pnpm dev                     # http://localhost:5175
```

## Commands

| Command          | Description                  |
| ---------------- | ---------------------------- |
| `pnpm dev`       | Dev server on port 5175      |
| `pnpm build`     | Production bundle in `dist/` |
| `pnpm preview`   | Serve the built bundle       |
| `pnpm typecheck` | TypeScript check             |
| `pnpm lint`      | ESLint                       |
| `pnpm test`      | Vitest unit tests            |

## Deploy

`dist/` is static. Host it behind a web server that rewrites unknown routes to `index.html`, e.g. Nginx:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

Set `VITE_API_BASE_URL` at build time (Vite inlines it), and add the deployed origin to the backend CORS allow-list. If hosting under a subpath, set `base` in `vite.config.ts` and the matching router basename.

## Layout

- `src/features` — sale, shift, transactions, reports, register, auth
- `src/lib/nexora` — local copy of UI kit, API client, types, auth, permissions, validation
- `src/registers` — active register/branch context

## API

Backend contract: `/api/v1`, JWT access + refresh, headers `Authorization`, `X-Organization-Id`, `X-Active-Branch-Id`.
