# Deploy DamnLove Makeup to `damnlovemakeup.com` (GitHub → Cloudflare Pages)

This project is **built for Cloudflare Pages + D1**. Follow these steps once; after that,
every `git push` redeploys automatically. Total time ~20–30 minutes.

> Your login secrets are in **`SECRETS.local.txt`** (kept private, never pushed to GitHub).

---

## 0. Before you start — two things to confirm

1. **You own `damnlovemakeup.com`** (bought at any registrar). If not, buy it first — I can't
   purchase it for you. Cheapest path: register it directly in Cloudflare (Dashboard →
   Domain Registration), which auto-connects DNS.
2. **WhatsApp number:** the whole site routes bookings to **+91 98396 75822**. If that is not
   Laveena's correct WhatsApp, tell me and I'll change it before you push.

You'll also need free accounts at **github.com** and **dash.cloudflare.com**, and Node.js +
the Cloudflare CLI installed:

```bash
npm install -g wrangler
wrangler login          # opens your browser to authorise your Cloudflare account
```

---

## 1. Push this folder to GitHub

From inside this folder (the git repo is already initialised with a first commit):

```bash
# create an EMPTY repo on github.com first (e.g. "damnlove-makeup"), then:
git remote add origin https://github.com/<your-username>/damnlove-makeup.git
git branch -M main
git push -u origin main
```

`.gitignore` already excludes `.dev.vars`, `SECRETS.local.txt`, `.wrangler/` and `node_modules/`,
so no secrets are pushed.

---

## 2. Create the database

```bash
wrangler d1 create damnlove-bookings
```

Copy the `database_id` it prints and paste it into **`wrangler.toml`**, replacing
`REPLACE_WITH_YOUR_D1_DATABASE_ID`. Commit + push that one-line change:

```bash
git add wrangler.toml && git commit -m "Add D1 database id" && git push
```

Load the tables into the live database:

```bash
wrangler d1 execute damnlove-bookings --remote --file=schema.sql
```

---

## 3. Create the Pages project (connect to GitHub)

Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick your
`damnlove-makeup` repo. Build settings:

- **Framework preset:** None
- **Build command:** *(leave empty)*
- **Build output directory:** `public`

Click **Save and Deploy**. You'll get a live `https://damnlove-makeup.pages.dev` URL in ~1 minute.

---

## 4. Add the database binding + login secrets

In the Pages project → **Settings → Bindings** → **Add → D1 database**:

- Variable name: `DB`  →  Database: `damnlove-bookings`

Then **Settings → Variables and Secrets** → add the four values from `SECRETS.local.txt`
(mark the last three as **Secret / encrypted**):

| Variable | Type |
|---|---|
| `ADMIN_USER` | plaintext |
| `ADMIN_PASSWORD` | secret |
| `SESSION_SECRET` | secret |
| `ADMIN_TOKEN` | secret |

Click **Retry deployment** (or push any commit) so the new binding + secrets take effect.

---

## 5. Connect your domain

Pages project → **Custom domains → Set up a custom domain** → enter `damnlovemakeup.com`
(and add `www.damnlovemakeup.com` too). If the domain's DNS is on Cloudflare, this is one click;
otherwise follow the CNAME instructions shown.

Done — the site is live on your domain, with bookings saving to D1 and the admin dashboard at
`https://damnlovemakeup.com/admin`.

---

## 6. After go-live (quick wins)

- **Google Analytics:** the code has a `G-XXXXXXXXXX` placeholder in 8 files. Create a GA4
  property, then find-and-replace `G-XXXXXXXXXX` with your real Measurement ID and push. (Site
  works fine without it — you just won't get traffic stats until you do.)
- **Admin login:** `https://damnlovemakeup.com/admin` — sign in with `ADMIN_USER` /
  `ADMIN_PASSWORD`.
- **Read bookings as JSON anytime:** `https://damnlovemakeup.com/api/bookings?token=<ADMIN_TOKEN>`
- **Google Business Profile + Search Console:** see `README.md` — these move local rankings more
  than any code.

---

## Where things live (reference)

```
wrangler.toml            Cloudflare Pages + D1 config (paste database_id here)
schema.sql               Database tables (bookings + blocked_dates)
functions/api/…          The booking + admin API (Cloudflare Pages Functions)
public/index.html        The website
public/admin/index.html  The Studio dashboard (login-protected)
public/articles/…        The journal + 6 articles
SECRETS.local.txt        Your env-var values (gitignored — never pushed)
```

*Why not Vercel? The booking API and database use Cloudflare Pages Functions + D1, which only
run on Cloudflare. On Vercel the homepage would load but bookings, the admin dashboard and the
availability calendar would all break. Cloudflare is the right (and free) home for this build.*
