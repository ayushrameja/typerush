# ⚠️ This Repository is Archived (Legacy)

This project is no longer actively maintained.  
A new version of the application lives here:

👉 https://github.com/ayushrameja/KeyBrawl

This repo is kept for historical reference.

## Cloudflare hosting for the archived frontend

The existing frontend runs at https://typerush.ayush.im on the `typerush`
Cloudflare Worker. `open-next.config.ts` and `wrangler.jsonc` use OpenNext to
build the Next.js app for Workers.

```bash
pnpm install --frozen-lockfile
pnpm run preview:cloudflare
pnpm run deploy:cloudflare
```

The preview script starts a local Workers preview. GitHub production builds and
branch preview deployments need a separate Workers Builds connection after this
migration is merged.

This hosting migration preserves the archived frontend as-is. It does not
restore the Convex backend or change the existing behavior when
`NEXT_PUBLIC_CONVEX_URL` is missing.
