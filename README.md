# DamnLove Makeup · Website + Booking System

A complete, deployable website for **DamnLove Makeup by Laveena** built for **Cloudflare Pages**, with bookings stored in a **Cloudflare D1** database via Pages Functions.

```
dlm-site/
├── wrangler.toml                 Cloudflare Pages + D1 configuration
├── schema.sql                    D1 schema (bookings + blocked_dates)
├── functions/
│   └── api/
│       ├── bookings.js           POST save booking · GET token export
│       ├── availability.js       GET blocked dates (public, for calendar)
│       └── admin/
│           ├── _auth.js          signed-cookie session helpers
│           ├── _middleware.js    guards all /api/admin/* routes
│           ├── login.js          POST login · GET session check
│           ├── logout.js         POST logout
│           ├── bookings.js       GET list · PATCH update status
│           └── availability.js   GET/POST/DELETE blocked dates
└── public/
    ├── index.html                The website (single page)
    ├── admin/index.html          Studio dashboard (login-protected)
    ├── assets/logo.svg           Vector logo (animated heart)
    ├── assets/mark.svg           dm mark only (favicon / small uses)
    ├── articles/…                Six full journal articles (own pages)
    ├── robots.txt · sitemap.xml  SEO
    └── _headers                  Security + cache headers
```

---

## Deploy (about 15 minutes, free tier works)

### 0. One-time setup
1. Create a free account at https://dash.cloudflare.com if you don't have one.
2. Install Node.js, then Cloudflare's CLI:
   ```bash
   npm install -g wrangler
   wrangler login
   ```

### 1. Create the database
```bash
cd dlm-site
wrangler d1 create damnlove-bookings
```
Copy the `database_id` it prints and paste it into `wrangler.toml`
(replacing `REPLACE_WITH_YOUR_D1_DATABASE_ID`).

Apply the schema:
```bash
wrangler d1 execute damnlove-bookings --remote --file=schema.sql
```

### 2. Deploy the site
```bash
wrangler pages deploy public
```
First run asks you to create the Pages project — name it `damnlove-makeup`.
You'll get a live URL like `https://damnlove-makeup.pages.dev` immediately.

### 3. Bind the database + admin token (dashboard)
In the Cloudflare dashboard → **Workers & Pages → damnlove-makeup → Settings**:
- **Bindings → Add → D1 database**: variable name `DB`, database `damnlove-bookings`.
- **Environment variables → Add**: name `ADMIN_TOKEN`, value = a long random secret
  (this protects the bookings list). Redeploy after adding.

### 4. Custom domain
Dashboard → your Pages project → **Custom domains** → add `damnlovemakeup.com`
(buy the domain anywhere; pointing it at Cloudflare DNS makes this one click).

> **Then do a find-and-replace**: the code uses `https://damnlovemakeup.com/` as the
> canonical URL (in `index.html`, `sitemap.xml`, `robots.txt`, and the three article
> pages). If your final domain differs, replace it everywhere.

---

## Where do bookings go?

Every confirmed booking is saved to D1 instantly. Read them any of these ways:

- **Browser / phone**: `https://YOUR-SITE/api/bookings?token=YOUR_ADMIN_TOKEN`
  returns all bookings as JSON, newest first.
- **CLI**:
  ```bash
  wrangler d1 execute damnlove-bookings --remote \
    --command "SELECT id, event_date, time_slot, name, phone, city, status FROM bookings ORDER BY id DESC LIMIT 20"
  ```
- The success screen also nudges the client to WhatsApp Laveena with their
  reference number, so every booking arrives twice: once in the database,
  once as a WhatsApp message.

Spam protection: a hidden honeypot field silently discards bot submissions,
and all inputs are validated and length-clipped server-side.

---

## Google Analytics (track your traffic)

The site and the admin dashboard already have the **Google Analytics 4 (gtag.js)**
snippet wired in — it just needs your Measurement ID.

1. Go to https://analytics.google.com → **Admin → Create → Property**, name it
   *DamnLove Makeup*, add a **Web** data stream for your domain.
2. Copy the **Measurement ID** — it looks like `G-ABCD1234XY`.
3. Find-and-replace **`G-XXXXXXXXXX`** with your real ID everywhere in the project
   (it appears in `public/index.html`, `public/admin/index.html`, and the article
   pages). On Mac: open the folder in VS Code → Edit → Replace in Files.
4. Redeploy (`wrangler pages deploy public`). Within a day you'll see live
   visitors, top pages, and where traffic comes from (Instagram, Google, etc.).

**Custom events already firing** (visible in GA → Reports → Engagement → Events):
- `open_booking` — someone opened the booking form
- `booking_confirmed` — a booking was submitted
- `whatsapp_click` — someone tapped through to WhatsApp

So you can see not just visits, but how many people actually try to book.

---

## SEO: what's already done, and what only you can do

**Built into the code (done):**
- Title/H1/meta targeting *makeup artist in Lucknow* + bridal/party/airbrush variants
- `BeautySalon` + `Person` + `WebSite` structured data with Lucknow geo coordinates,
  `areaServed` including Lucknow → India → Worldwide
- `FAQPage` structured data (5 questions, eligible for rich results)
- `Article` + `BreadcrumbList` structured data on all three journal articles
- A dedicated, naturally-written "Makeup artist in Lucknow" content section
  naming real localities (Gomti Nagar, Hazratganj, Indira Nagar, Alambagh)
- Canonical URLs, Open Graph/Twitter cards, geo meta tags, sitemap.xml, robots.txt
- Fast Core Web Vitals: single request page, lazy images, no heavy libraries

**Your checklist (these move rankings more than any code can):**
1. **Google Business Profile** — create/claim "DamnLove Makeup" as a
   service-area business based in Lucknow, category *Makeup artist*. Add photos
   weekly and ask happy brides for Google reviews. For "makeup artist in Lucknow"
   searches, the map pack IS the number-one spot.
2. **Google Search Console** — add the domain, submit `sitemap.xml`.
3. **Instagram → website** — put the site link in the @damnlove_makeup bio and
   stories; social clicks are a real ranking signal.
4. **Reviews with the word "Lucknow"** — when brides leave Google reviews,
   the city name inside review text strengthens local relevance.
5. **Local backlinks** — wedding photographers (Yaadgaar Frames!), venues,
   planners in Lucknow linking to the site.
6. **Keep the journal alive** — one new article a month compounds.

*Honest note: nobody can guarantee the #1 organic position — anyone who promises
that is selling something. This build gives the site every on-page signal Google
looks for; the checklist above is how local #1 actually gets won, usually via the
map pack + reviews within a few months of consistent effort.*

---

## Local development

```bash
wrangler pages dev public
```
This serves the site AND the `/api/bookings` function locally
(add `--d1 DB=damnlove-bookings` to test against a local D1).

## Updating content

- **Swap portfolio/hero images**: edit the Unsplash URLs in `public/index.html`
  (search for `images.unsplash.com`) — replace with Laveena's own hosted photos
  (put them in `public/assets/` and reference `/assets/photo.jpg`).
- **Prices**: search for "On request" in `index.html`.
- **New article**: copy an existing folder under `public/articles/`, edit, and
  add a line to `sitemap.xml`.

---

## Admin dashboard (Laveena's studio panel)

A full private dashboard lives at **`/admin`** (e.g. `https://damnlovemakeup.com/admin`).
It is `noindex` and protected by a username + password.

### What it does
- **Requests** — every website booking, newest first, with live status counts.
  One tap: **WhatsApp the client** (message pre-filled and personalised with their
  Booking Request ID), **Confirm** a request (status → confirmed), **Mark done**,
  **Cancel**, or **Reopen**. Filter by status and search by name/phone/city.
- **Availability** — a full calendar flow: tap any future date to block/open it,
  **block a whole range** at once (going out of town), and see every upcoming
  blocked date in a live list with one-tap "open". Blocked dates instantly vanish
  from the public booking calendar on the website (shown struck-through).
- **Content Studio** — generates ready-to-post Instagram captions (7 post types)
  in Laveena's brand voice, with a matching hashtag set, one-click copy.
- **Growth Plan** — a complete 8-week Lucknow comeback playbook baked into the
  dashboard: strategy, the full comeback-film script (with Hinglish dialogues +
  shot list), an 8-week arc, a day-by-day plan, 20 reel ideas with hooks, photo
  shot lists, ready-to-paste captions, hashtag sets, and the engagement engine —
  every content block has a one-click **Copy** button.

### Setting the login
In the Cloudflare dashboard → your Pages project → **Settings → Environment variables**,
add these (mark the last three as **Secret / encrypted**):

| Variable | Example | Purpose |
|----------|---------|---------|
| `ADMIN_USER` | `laveena` | dashboard username |
| `ADMIN_PASSWORD` | *a strong password* | dashboard password |
| `SESSION_SECRET` | *a long random string* | signs the login session cookie |
| `ADMIN_TOKEN` | *a long random string* | optional: raw JSON export at `/api/bookings?token=` |

Redeploy after adding them. That's it — Laveena signs in at `/admin` on any device.

### Status lifecycle
`new` → **Confirm** → `confirmed` → **Mark done** → `done` (or **Cancel** → `cancelled`, **Reopen** → `new`).
Confirming a booking on the dashboard changes its status in the D1 database, and the
client-facing WhatsApp message from the dashboard automatically switches from
"thank you for your request" to "your booking is confirmed!" once confirmed.

### Run it locally (bookings + dashboard)
A ready-made `.dev.vars` file is already included in this folder with local login
credentials (`laveena` / `testpass123`), so you can start immediately:
```bash
npm install -g wrangler                                        # one-time
wrangler d1 execute damnlove-bookings --local --file=schema.sql  # one-time: seed DB
wrangler pages dev public                                       # start
```
Then open `http://localhost:8788` (site) and `http://localhost:8788/admin`
(dashboard — sign in with laveena / testpass123).

Change the password anytime by editing `.dev.vars`. These are local-only; the live
site's login is set separately in the Cloudflare dashboard (see the table above).
`.dev.vars` is gitignored so it never gets committed.
