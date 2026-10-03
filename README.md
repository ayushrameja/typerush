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

`preview:cloudflare` starts a local Workers preview. `deploy:preview` publishes
a branch Preview URL without changing production.

Configure the existing Worker in Settings > Builds:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | `/` |
| Build command | `pnpm run build:cloudflare` |
| Deploy command | `pnpm exec opennextjs-cloudflare deploy` |
| Preview command | `pnpm exec wrangler preview` |
| Enable Preview builds | Enabled |
| Build variable `PNPM_VERSION` | `11.3.0` |
| Build variable `NODE_VERSION` | `24` |

After the Git connection and deployment token are configured in Cloudflare,
pushes to `main` deploy production and other branches create Preview URLs.
Worker Previews do not inherit production secrets.

This hosting migration preserves the archived frontend as-is. It does not
restore the Convex backend or change the existing behavior when
`NEXT_PUBLIC_CONVEX_URL` is missing.
