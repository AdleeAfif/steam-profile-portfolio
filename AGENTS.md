# AGENTS.md - Steam Profile Portfolio

Instructions for coding agents working in this repository. Read this whole file before making changes.

## 1. What this project is

A personal developer portfolio for **Adlee Afif** (Cloud Engineer, Kuala Lumpur, Malaysia) styled after a **Steam Community profile**, served at `https://adlee.my`. Every Steam profile feature maps to a piece of career data:

| Steam feature    | Portfolio meaning                        |
| ---------------- | ---------------------------------------- |
| Level            | Years of professional experience         |
| Online status    | Available / Working / Sleeping / Holiday |
| Badges           | Certificates                             |
| Inventory        | Skills, with a tab per company           |
| Games library    | Projects                                 |
| Achievements     | Career milestones                        |
| Recent activity  | GitHub activity                          |
| Friends / Groups | Socials / Communities and education      |
| Comments         | Guestbook                                |
| Wishlist         | Learning roadmap                         |

This repo is the **frontend only**. All data comes from **profile-api** (`C:\Workspace\profile-api`), a shared Go service backed by MongoDB Atlas. Read that repo's `AGENTS.md` and `api/openapi.yaml` before touching data code. This app never connects to MongoDB.

Both run on a **Raspberry Pi 5 (8 GB, SD card) with k3s**, exposed through a **Cloudflare Tunnel**.

Predecessor project (visual reference only, do not modify): `C:\Workspace\linux-portfolio`.

## 2. Tech stack (fixed - do not substitute)

- **Astro 5** with `output: "server"` and the **`@astrojs/node`** adapter in `standalone` mode.
- **TypeScript** strict (`astro/tsconfigs/strict`). Pinned to 5.x, because `@astrojs/check` and `openapi-typescript` don't support TypeScript 7 yet.
- **Tailwind CSS v4** through the `@tailwindcss/vite` plugin. Theme tokens (`steam-*` colours) are in `src/styles/global.css`.
- **React islands** (`@astrojs/react`) only for interactive parts. Everything else is `.astro` with zero client JS.
- **API client**: types generated from profile-api's OpenAPI spec with `openapi-typescript`, and requests made with `openapi-fetch`.
- **Container**: multi-arch image (`linux/arm64` required), deployed to k3s with manifests in `k8s/`.
- Package manager **npm**, Node **20 LTS** or newer. The image uses Node 22, because Node 20 reached end of life in April 2026.

Pi constraints:

- Target under 200 MB for the container.
- No writes to local disk at runtime.
- Log to stdout only.

## 3. How data flows

```mermaid
flowchart LR
  browser[Browser] --> cf[Cloudflare edge]
  cf --> tunnel[Cloudflare Tunnel]
  subgraph pi [Raspberry Pi 5 - k3s]
    tunnel --> astro["steam-portfolio :4321"]
    astro -->|"public reads, writes with X-API-Key"| apiPublic["profile-api :8080"]
    astro -->|"admin, Bearer token"| apiAdmin["profile-api :8081"]
  end
  apiPublic --> atlas[(MongoDB Atlas)]
  apiAdmin --> atlas
```

- **Pages**: Astro server code calls profile-api over cluster DNS (`PROFILE_API_URL`), renders HTML and returns it. Islands receive data as props and do not fetch on load.
- **Status refresh**: the status island polls this app's `/api/status.json` every 60s. That route proxies `GET /v1/status`.
- **Contact and guestbook**: the browser POSTs to this app's `/api/contact` and `/api/comments`. Those routes forward to `POST /v1/apps/steam-portfolio/{messages|comments}` with:
  - `X-API-Key: PROFILE_API_KEY`
  - `X-Client-IP` set from `CF-Connecting-IP`

  The API key never reaches the browser.

- **Admin**: `/admin` pages call the admin listener (`PROFILE_API_ADMIN_URL`) server-side with the session token stored in an HTTP-only cookie.
- **Caching**: profile-api already caches reads, so this app has no data cache of its own. Public pages send `Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=300` for the Cloudflare edge. Admin pages, `/api/*` and any response that sets a cookie send `private, no-store`.
- **Failure**: if profile-api is unreachable or returns 5xx, render the page shell with a Steam-style "Unable to load" panel for that section. Never return a raw 500 for a public page.

## 4. Commands

```bash
npm install
npm run dev            # http://localhost:4321
npm run build
npm run preview        # node ./dist/server/entry.mjs
npm run check          # astro check - must pass
npm run lint           # eslint - must pass
npm test               # vitest
npm run gen:api        # openapi-typescript ../profile-api/api/openapi.yaml -o src/lib/api/schema.d.ts
git tag v0.1.1 && git push origin v0.1.1   # release: .github/workflows/release.yml tests, pushes docker.io/adleeafif/steam-portfolio:0.1.1, deploys on the Pi
```

For local development, run profile-api locally (`make run` in that repo) and point `PROFILE_API_URL` at `http://localhost:8080` and `PROFILE_API_ADMIN_URL` at `http://localhost:8081`.

Local setup on the Windows dev machine:

- The Cursor sandbox can't start a terminal here, so shell commands need to run unsandboxed.
- `make` may be missing. Load profile-api's `.env` in PowerShell and run Go directly: `Get-Content .env | Where-Object { $_ -match '^\s*([A-Z_]+)=(.*)$' } | ForEach-Object { Set-Item "env:$($Matches[1])" $Matches[2].Trim("'`"") }; go run ./cmd/seed; go run ./cmd/api`.
- A throwaway database works fine: `docker run -d --name spp-mongo -p 27017:27017 mongo:7` with `MONGODB_URI=mongodb://localhost:27017`.
- The seed prints the steam-portfolio API key only on the first run. Put it in this repo's `.env`.
- `SITE_URL` is `http://localhost:4321`. When testing a mutating request against a dev server on another port, send `Origin: http://localhost:4321` or the CSRF check returns 403.
- Run only one `astro dev` at a time. Parallel dev servers share `node_modules/.vite` and break React hydration (`jsxDEV is not a function`). Fix it with `npx astro dev --force`.

Definition of done for any change:

- `npm run check`, `npm run lint` and `npm run build` pass.
- `src/lib/api/schema.d.ts` is regenerated after API changes.
- The affected page renders against a locally running, seeded profile-api.

## 5. Environment variables

| Variable                | Required | Purpose                                                                                     |
| ----------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `PROFILE_API_URL`       | yes      | e.g. `http://profile-api.profile-api.svc.cluster.local:8080`                                |
| `PROFILE_API_ADMIN_URL` | yes      | e.g. `http://profile-api-admin.profile-api.svc.cluster.local:8081`                          |
| `PROFILE_API_KEY`       | yes      | Server key for client app `steam-portfolio` (printed by profile-api's seed or key rotation) |
| `PROFILE_API_APP`       | no       | Default `steam-portfolio`                                                                   |
| `SITE_URL`              | yes      | Public URL for canonical links and the CSRF `Origin` check                                  |
| `TRUST_CF_HEADERS`      | no       | `true` in production. Read the client IP from `CF-Connecting-IP`                            |
| `PUBLIC_GA_ID`          | no       | Google Analytics 4. Skip GA when unset                                                      |
| `RESUME_HOST`           | no       | Hostname serving the one-page resume at `/`, e.g. `recruit.adlee.my`. Unset: it's at `/resume`   |

In k3s these come from secret `steam-portfolio-env`. Commit only `k8s/secret.example.yaml`.

All of them are declared in `astro.config.mjs` as `astro:env` server **secrets**, so they are read at runtime rather than inlined at build time, and one image serves every environment. Import them from `astro:env/server`. `PUBLIC_GA_ID` is a server secret too: the layout renders the GA snippet only when it is set.

## 6. Project structure

```
src/
  pages/
    index.astro                 # Profile
    badges/index.astro
    badges/[id].astro
    inventory.astro
    games/index.astro
    games/[slug].astro
    achievements.astro
    wishlist.astro
    replay.astro
    store.astro                 # "Hire Me"
    shop.astro                  # Points Shop
    resume.astro                # one-page recruiter resume (own styles/resume.css), served on RESUME_HOST
    404.astro
    admin/
      login.astro, logout.ts
      index.astro               # dashboard: status switch, summary counts
      profile.astro
      [collection]/index.astro  # list, reorder, delete, rotate key (clients)
      [collection]/[id].astro   # edit; `_new` creates
      inbox.astro, moderation.astro
    api/
      status.json.ts            # proxy GET /v1/status
      contact.ts                # forward to /v1/apps/{app}/messages
      comments.ts               # GET approved / POST forward to /v1/apps/{app}/comments
      _forward.ts               # shared body parsing and error mapping (underscore = not a route)
      admin/[...path].ts        # authenticated proxy for admin island actions
      health.ts                 # liveness for k8s
  layouts/
    BaseLayout.astro            # Steam client chrome + Deck nav, toast root, shop CSS vars, GA
    AdminLayout.astro
  components/
    Panel.astro, Unavailable.astro, EmptyState.astro
    profile/ badges/ games/ achievements/ inventory/ wishlist/ replay/ store/ admin/
    islands/                    # React islands (StatusPanel, Inventory, ContactForm, Guestbook, ShopIsland, ...)
  scripts/
    layout.ts                   # runs on every page: nav dropdown, easter eggs
    eggs/                       # online toast, card drops, Konami listener
  lib/
    api/
      schema.d.ts               # generated, do not edit
      types.ts                  # schema aliases, ApiResult, COLLECTIONS
      result.ts                 # settle(), timeouts, degraded-request tracking
      public.ts                 # typed client for :8080
      admin.ts                  # typed client for :8081, takes the session token; proxy forwarding
      admin-collections.ts      # create, replace, delete, reorder
    admin/                      # form field descriptors, 401 guard, flash messages, app list, time zones
    presentation/
      level.ts                  # ring colour by level
      status.ts                 # labels and colours per status kind
      rarity.ts                 # tier names and colours
    client/                     # browser-only: localStorage helpers and STORAGE_KEYS, toasts
    eggs/                       # pure card-drop and Konami logic
    cards.ts                    # trading card catalogue and change event
    shop.ts                     # Points Shop backgrounds and frames
    format.ts                   # dates, months, relative time, hours
    http.ts                     # cache headers, client IP, Origin check, JSON responses
    session.ts                  # cookie read/write for the admin token
  middleware.ts                 # /admin guard, CSRF Origin check, Cache-Control
  styles/global.css
scripts/
  trace-runtime.mjs             # copies only the runtime-needed node_modules into .runtime/
k8s/
  kustomization.yaml            # sets the image registry and tag
  namespace.yaml                # label profile-api/admin-client: "true"
  deployment.yaml
  service.yaml
  secret.example.yaml
Dockerfile
```

Tests are `*.test.ts` next to the code they cover, under `src/`. Under `src/pages`, prefix them with `_` (for example `_proxy.test.ts`), or Astro builds them as routes.

The shared `cloudflared` deployment lives in profile-api's `deploy/cluster`, not here.

## 7. Presentation rules (`src/lib/presentation`)

The API returns raw values (`level`, `status.kind`, skill `tier`). Labels and colours are decided here.

- **Level ring colour** changes every 10 levels. The index is `floor(level / 10) % 10`:

  | Index | Colour    |
  | ----- | --------- |
  | 0     | `#9b9b9b` |
  | 1     | `#c02942` |
  | 2     | `#d95b43` |
  | 3     | `#fecc23` |
  | 4     | `#467a3c` |
  | 5     | `#4e8ddb` |
  | 6     | `#7652c9` |
  | 7     | `#c252c9` |
  | 8     | `#542437` |
  | 9     | `#997c52` |

  The XP bar uses `level.progress`. When `level.isAnniversary` is true, show a one-time "LEVEL UP" animation, remembered in localStorage.

- **Status**:

  | kind      | Label   | Colour    | Extra line                                                       |
  | --------- | ------- | --------- | ---------------------------------------------------------------- |
  | available | Online  | `#57cbde` | "Open to chat"                                                   |
  | working   | In-Game | `#90ba3c` | "Currently playing: {currentRole.title} @ {currentRole.company}" |
  | sleeping  | Snooze  | `#4b8c9b` | Local time (`localTime`)                                         |
  | holiday   | Away    | `#898989` | "On holiday" (until `overrideUntil` when set)                    |

- **Rarity (skill tier)**:

  | Tier | Name             | Colour    | Proficiency  |
  | ---- | ---------------- | --------- | ------------ |
  | 1    | Consumer Grade   | `#b0c3d9` | Familiar     |
  | 2    | Industrial Grade | `#5e98d9` | Beginner     |
  | 3    | Mil-Spec         | `#4b69ff` | Intermediate |
  | 4    | Restricted       | `#8847ff` | Proficient   |
  | 5    | Classified       | `#d32ce6` | Advanced     |
  | 6    | Covert           | `#eb4b4b` | Expert       |

## 8. Pages and features

Visual language:

- Steam colours: background `#1b2838`, header `#171a21`, panels `rgba(0,0,0,0.3)`, accent `#66c0f4`, text `#c7d5e0`, muted `#8f98a0`.
- Steam button styles: blue-translucent and green gradient.
- Content is a centred 976px column.
- The footer says the site is not affiliated with Valve. Use no Valve logos or assets.

Pages:

- **Base layout**: Steam client top bar with STORE (`/store`), LIBRARY (`/games`), COMMUNITY (`/achievements`) and, last, ADLEE AFIF (`/`, with a dropdown for Profile, Badges, Inventory, Games, Achievements, Wishlist, Replay, Points Shop). The favicon is the owner's logo (`public/favicon.svg`, with a PNG fallback). On mobile, a bottom tab bar replaces it ("Steam Deck mode"): Profile, Library, Inventory, Badges, Store.
- **Profile (`/`)**, from `GET /v1/profile` plus the other list endpoints, fetched in parallel:
  - **Header**: avatar with the selected frame, persona name, country flag (`https://flagcdn.com/24x18/{cc}.png`), real name, location, summary, Level card (ring, XP bar, "N XP to Level N+1"), featured badge, and "Message" / "Download Resume" buttons.
  - **Left column** showcases: Favorite Game, Item Showcase (`showcaseSkillIds`), Rarest Achievement (lowest `globalPercent` among unlocked), Review Showcase, Workshop Showcase, Recent Activity (`/v1/activity`, labelled as an estimate), Comments, and the contact form.
  - **Right column**: status panel, counts linking to each page, Groups, Friends.
- **Badges (`/badges`, `/badges/[id]`)**: certificate grid with issuer, date, XP and `totalXp`. The detail page shows related skills (linked to the inventory) and a "Verify" button. The page also shows the trading card collection.
- **Inventory (`/inventory`)** (island), using `/v1/skills` and `/v1/companies`:
  - Tabs: "All" plus one per company, in `order`.
  - Search and a category filter.
  - Item grid with a rarity-coloured bottom border and a simpleicons image (`https://cdn.simpleicons.org/{slug}/{color?}`), or a text fallback.
  - Clicking an item opens a side panel with rarity, proficiency, years used, description, companies and projects.
  - Tab and item are kept in `?tab=&item=`.
- **Games (`/games`, `/games/[slug]`)**:
  - The library shows hours played, `lastPlayed` and achievement progress.
  - The detail page is store-style: banner, description, tags, "Play" and "View Source" buttons, and achievements.
- **Achievements (`/achievements`)**: unlocked first, then locked (greyed out), with "X% of players", an overall progress bar, and a hidden Konami-code achievement (client-side, localStorage).
- **Wishlist (`/wishlist`)**: target "release date" and a progress bar.
- **Replay (`/replay`)**: from `/v1/replay`, with a year selector (`?year=`).
- **Store (`/store`)**: a "Hire Me" page.
  - "Add to Cart" downloads the resume.
  - "Add to Wishlist" opens the contact form.
  - System requirements show the stack, and the review score comes from reviews.
- **Points Shop (`/shop`)** (island): CSS backgrounds and avatar frames. Everything is free, and the choice is saved in localStorage.
- **Contact and guestbook**:
  - Forms include the honeypot field `website`.
  - Show Steam-style toasts on success.
  - On 429, show the "slow down" message returned by the API.
  - Guestbook comments only appear after approval.
- **Easter eggs** (client-side, localStorage):
  - an "Adlee is now Online" toast once per session
  - the Konami achievement
  - trading card drops: 25% chance per navigation, 6 cards, and collecting all of them crafts a bonus badge on `/badges`

## 9. Admin UI (`/admin`)

- **Login** posts to `POST /v1/admin/login` server-side. Store the returned token in an HTTP-only, `Secure`, `SameSite=Strict` cookie that expires at `expiresAt`. Logout calls `POST /v1/admin/logout` and clears the cookie.
- **Access control**:
  - Middleware redirects to the login page when the cookie is missing, or when the API answers 401.
  - Every mutating request must pass an `Origin` check against `SITE_URL`.
  - In production, `/admin*` and `/api/admin*` are also behind Cloudflare Access (owner's email only).
- **Dashboard**:
  - A status quick switch at the top (Auto / Available / Working / Sleeping / Holiday, optional "until") calls `PUT /v1/admin/status`.
  - Counts of unread messages and pending comments come from `GET /v1/admin/summary`.
- **Collections**: a list and edit form for each collection (profile, companies, skills, certificates, projects, achievements, friends, groups, reviews, workshop, wishlist, clients), with reordering via `/reorder`.
- **Inbox and moderation**: an inbox for messages and moderation for comments. Both are scoped to `PROFILE_API_APP`, with an app switcher for other client apps.
- **Validation**: show validation errors from the API's `error.details` next to the matching form fields.

## 10. Deployment

- **Image**: multi-stage `Dockerfile`.
  - The build stage (`node:22-alpine`, on `$BUILDPLATFORM`) runs `npm run build`, then `scripts/trace-runtime.mjs`. That uses `@vercel/nft` to copy only the files `dist/server/entry.mjs` actually loads into `.runtime/` (about 3 MB instead of about 105 MB of production dependencies).
  - The runtime stage is `alpine` with `libstdc++`, the `node` binary copied from `node:22-alpine`, a `node` user (uid 1000) and `.runtime/`. No npm or yarn. Keep the `alpine` tag on the same release as `node:22-alpine`'s base (`cat /etc/alpine-release`).
  - Building on the host platform is safe only while every traced dependency is pure JavaScript. Never add a native module (such as `sharp`) to the server bundle.
  - The result is about 140 MB on disk and about 26 MiB RSS when idle.
  - Environment: `HOST=0.0.0.0`, `PORT=4321`, `NODE_OPTIONS=--max-old-space-size=160`.
- **`k8s/`** (namespace `steam-portfolio`, labelled `profile-api/admin-client: "true"` so profile-api's NetworkPolicy allows admin traffic):
  - **Deployment**: 1 replica.
    - Resources: requests `cpu: 50m, memory: 96Mi`, limit `memory: 256Mi`.
    - Probes on `/api/health`.
    - `securityContext`: `runAsNonRoot`, `readOnlyRootFilesystem`, all capabilities dropped.
    - `envFrom` secret `steam-portfolio-env`.
  - **Service**: `ClusterIP` on port 4321.
  - No Ingress. Traefik is not used.
- **Releases**: a `v*.*.*` tag runs `.github/workflows/release.yml`. The deploy job runs on the Pi's self-hosted runner (label `rpi5`), writes the `ENV` repository secret (the whole production `.env`) into `steam-portfolio-env`, and sets `newTag` only in its own checkout, so the committed tag is just the first-deploy value. Runner setup is in profile-api `docs/deploy.md` section 5.
- **Cloudflare**:
  - The shared tunnel (profile-api `deploy/cluster`) routes `<portfolio-domain>` to `http://steam-portfolio.steam-portfolio.svc.cluster.local:4321`.
  - Add a Cache Rule that caches HTML while respecting origin headers and bypasses `/admin*` and `/api/*`.
  - Add an Access application on `/admin*` and `/api/admin*`.

## 11. Conventions

- Only `src/lib/api/*` calls profile-api. Pages and components call those helpers.
- No hard-coded career content in components.
- Ship no client JS unless needed. Prefer `client:visible` or `client:idle`.
- Accessibility:
  - Tabs and dialogs work with the keyboard.
  - Every image has `alt` text.
  - Colour is never the only signal; rarity and status also show their names.
- Keep comments rare. Only explain constraints the code cannot show.
- Conventional Commits.

## 12. Build order

Each phase should leave the app building. All eleven phases are complete. New work extends the existing pages and helpers.

1. Scaffold Astro (server output, Node adapter, TS strict, Tailwind, React), `.env.example`, generated API types, and `src/lib/api`.
2. Presentation helpers with Vitest tests. Base layout (Steam chrome + Deck nav).
3. Profile header and the `/api/status.json` proxy.
4. Badges.
5. Inventory island.
6. Games.
7. Achievements, showcases, activity, friends and groups.
8. Admin login, dashboard status switch, and collection editors (needs profile-api phase 6).
9. Contact and guestbook forwarding with moderation pages (needs profile-api phase 7).
10. Wishlist, Replay, Store, Points Shop, easter eggs, and GA4.
11. ARM64 Dockerfile and `k8s/` manifests.

## 13. Implementation notes

Decisions made while building that the spec above doesn't spell out. Keep them unless you mean to change the behaviour.

**Config**

- `security.checkOrigin` is off. Behind the tunnel the request URL is the internal cluster address, so Astro's own check would reject everything. `src/middleware.ts` compares `Origin` with `SITE_URL` instead.
- `session.driver` is `memory`. The Node adapter's default is file storage, which breaks the no-disk-writes rule.
- `image.service` is the passthrough service. The default pulls in `sharp`, a native module that breaks the multi-arch image. The site uses no Astro image optimisation.

**API client**

- Every helper in `src/lib/api` returns `ApiResult<T>`: `{ ok: true, data, status }` or `{ ok: false, status, error }`. `status` is `0` when profile-api is unreachable. Requests time out after 5 seconds.
- `settle()` marks the current request as degraded on status `0` or `5xx`, through `AsyncLocalStorage`. The middleware then sends `Cache-Control: no-store` so Cloudflare doesn't cache an "Unable to load" page. This only covers fetches made before the response starts streaming, so pages fetch their data in the page frontmatter, not inside child components.
- Use `isNotFound()` for 404s and render the not-found page with status 404.

**Middleware**

- `GET`/`HEAD` requests to `www.` plus `SITE_URL`'s host get a 301 to the same path on `SITE_URL`. Both hostnames reach the site through the tunnel.
- It rejects every `POST`, `PUT`, `PATCH` and `DELETE` whose `Origin` isn't `SITE_URL`'s origin or its `www.` variant, with 403.
- Without the session cookie, `/admin*` (except `/admin/login`) redirects with 303 to `/admin/login?next=...`, and `/api/admin*` returns 401 JSON.
- Cache headers:
  - `private, no-store` for `/admin*`, `/api/*` and any response with `Set-Cookie`.
  - `no-store` for degraded pages.
  - The public value for other 200 HTML responses that set no header of their own.
  - `no-store` for everything else.
- Redirect responses have immutable headers, so it builds a new `Response` when it needs to change them.
- When `RESUME_HOST` is set (`src/lib/resume.ts`), `GET /` on that host is rewritten to `/resume`, `/_astro/`, `/favicon.*`, `/resume/*` and `/api/health` pass through, and every other path gets a 301 to the same path on `SITE_URL`. `/resume` on the main host gets a 301 to the resume host. Locally, `RESUME_HOST=recruit.localhost` works at `http://recruit.localhost:4321`.

**Resume page**

- Not Steam-themed and doesn't use `BaseLayout`: warm paper, navy (`#1b2838`), sky (`#66c0f4`) and coral, with Fraunces and Outfit from Google Fonts. `resume.css` is a separate Tailwind entry with `source(none)`, so neither theme leaks into the other.
- Everything except the photo (`public/resume/adlee.jpg`) comes from profile-api. Experience is `companies` of kind `work`, with each job's top skills by tier. Education is `groups`. Focus-area tags come from the part of `headline` after the last `|`.

**Forms and forwarding**

- `/api/contact` and `/api/comments` share `src/pages/api/_forward.ts`. It caps bodies at 16 KB, and maps API responses as follows:
  - 201 passes through.
  - 400 and 413 pass through with `error.details`.
  - 429 passes through with the API's message.
  - Anything else becomes 503.
- `clientIp()` reads `CF-Connecting-IP` only when `TRUST_CF_HEADERS` is true. Never forward a browser-supplied `X-Client-IP`, because profile-api trusts it for rate limits and the login lockout. `src/pages/api/_proxy.test.ts` covers this, plus header forwarding and error mapping for every proxy route.
- On 429 the API client keeps `Retry-After` (`ApiResult.retryAfter`, seconds or HTTP date). The proxy passes the header on and turns it into a friendly "try again in about N minutes" message. Admin login does the same for the lockout.
- `GET /api/comments` forwards `cursor` and `limit` (1-100, as in the contract).
- The API's field errors are fragments such as "is required", so the forms prefix the field label.

**Admin**

- Pages handle their own form POSTs on the server and then redirect (POST-redirect-GET), so they need almost no client JS. One-time notices travel in a short-lived HTTP-only flash cookie.
- `/admin/{collection}/_new` is the create page. Real ids can't start with `_`.
- `adminApi(token, clientIp)`, `adminCollections(token, clientIp)` and `forwardAdmin(...)` send `X-Client-IP` from `clientIp(request)` on every admin call, not only on login (profile-api `docs/deploy.md` section 8). Without it, every admin login would share the pod's lockout bucket.
- Admin results are typed only by the generated schema. Don't annotate or cast them; for example, `PUT /v1/admin/status` returns `StatusConfig`, not `Profile`.
- On any 401 from the API, `src/lib/admin/guard.ts` clears the cookie and redirects to login. `next` is only followed when it starts with `/admin` and not `//`.
- The status "until" field is read in the owner's time zone, not the server's.
- `/api/admin/[...path]` refuses `login`, `logout` and malformed paths, caps bodies at 1 MiB, and clears the cookie on 401.

**Client-side features**

- localStorage keys are in `STORAGE_KEYS` (`src/lib/client/storage.ts`). Use `readJson` and `writeJson`, which never throw.
- The Points Shop selection is applied before first paint by an inline script in `BaseLayout`. It sets `--profile-bg` (body background) and `--avatar-frame` (avatars use `box-shadow: var(--avatar-frame, none)`).
- Card drops dispatch `CARDS_CHANGED_EVENT` (`src/lib/cards.ts`) after writing, because `storage` events don't fire in the same tab. Drops are skipped on `/admin*`.
- The site-wide Konami listener is skipped on `/achievements`, which has its own. Both check the storage key first, so the toast shows only once.

**Known data issues (fix in profile-api's seed or through `/admin`)**

- `featuredBadgeId` is `graduated`, which is an achievement, not a certificate, so no featured badge shows.
- The AWS skill's icon slug `amazonwebservices` doesn't exist on simpleicons, so it falls back to "AW".
- The resume is on another domain, so "Add to Cart" opens it instead of downloading it.
