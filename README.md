# pillar-site

The public pages for the Pillar iPhone app, served as a static GitHub Pages site at
**https://pillar.glowd.tech**.

Two of these pages are required to submit the app: App Store Connect will not accept a
build without a Privacy Policy URL and a Support URL, and Apple's guideline 3.1.2 requires a
working link to the subscription terms on the purchase screen.

| File | URL | Used as |
|---|---|---|
| `index.html` | `/` | App Store *Marketing URL*; the marketing landing page |
| `privacy-policy.html` | `/privacy-policy.html` | App Store *Privacy Policy URL*, You tab |
| `terms-of-use.html` | `/terms-of-use.html` | App Store *EULA / Terms*, You tab, paywall |
| `subscription-terms.html` | `/subscription-terms.html` | Paywall link, You tab |
| `support.html` | `/support.html` | App Store *Support URL*, You tab |
| `robots.txt` · `sitemap.xml` · `llms.txt` | root | Crawlers and answer engines |

**What is deliberately not here:** the onboarding bundles (`b/`), `version.json` and
`codes.json` — the files the *app* fetches — live in `ota-site/` and are served from
`ota.glowd.tech`, a different pages repo. The deciding reason is one line further down
this page: `deploy-pillar-site.sh` mirrors with `rsync --delete`, so a copy edit pushed
from a checkout that happened not to have `b/` would silently take every published
onboarding bundle with it. See `ota-site/README.md`.

Shared front end: `assets/styles.css` (the whole site), `assets/mascot.js` +
`assets/rig-vectors.js` (the live mascot), `assets/pillar.js` (analytics and the
one scripted interaction).

## The landing page

`index.html` is a single long-scroll page in the app's own **Window light** world
(see `DESIGN.md`): a sky plane over a desk sheet, olive for action, gold for
reward, clay for warning. Every app screen on it except the hero is **hand-built
HTML**, not a screenshot, so it has to be updated when the app's own screens
move. The hero uses `assets/shots/today.webp`, rendered from
`docs/design/pillar-aso-screens/`.

The flower is the real rig: `assets/rig-vectors.js` is a copy of
`carry-mascot/rig/rig_vectors.js` and `assets/mascot.js` is a port of that
folder's `vector.html` spring engine. Pose an instance from markup —
`<div class="mascot" data-lean="0.9" data-expr="-0.4" data-reward="1">` — and the
idle breath, blinks, petal follow-through and reward bloom come for free. Re-copy
`rig_vectors.js` if the traced geometry ever changes. `assets/mascot.svg` is the
still fallback shown before the rig mounts and when JavaScript is off.

**The App Store badge points nowhere yet.** When the listing exists, replace the
five `href="#get"` values on `a.store` (hero, mid-page strip, close, dock) with
the real URL, drop the "Coming to iPhone" note beside the hero badge and the
"Coming to the App Store" line in the close card, and add `downloadUrl` +
`sameAs` to the `SoftwareApplication` node in the JSON-LD.

## Analytics

`assets/pillar.js` sends three events to the **same** PostHog project the app
uses (`Pillar`, 598334): `site_page_viewed`, `site_cta_clicked` (with the `slot`
that was pressed) and `site_faq_opened`. It runs cookieless — `persistence:
'memory'`, `person_profiles: 'never'`, `respect_dnt: true`, no autocapture, no
session recording, no surveys or flags — so the site needs no consent banner.
**Adding or renaming an event means editing `privacy-policy.html` §4 "This
website" in the same commit.**

## Answer engines

`llms.txt` is the plain-text brief an answer engine reads, and it is written to
sell, not to describe: the one-line pitch, why Pillar beats a camera app, a
posture wearable, a reminder app and a generic threshold, the focus loop, what
you get, requirements, privacy, price and who it is for. It must never invent a
rating, a testimonial, a press mention or a user count — Pillar has none — but
everything true about the product belongs in it.
`index.html` carries an `Organization` / `WebSite` / `WebPage` /
`SoftwareApplication` / `HowTo` / `FAQPage` graph. **Keep `llms.txt`, the FAQ
markup, the `#requirements` ledger and the JSON-LD saying the same thing** — a
contradiction between them is worse than any one of them being absent.

The URLs are hard-coded in the app in
[`pillar/src/Pillar/Utilities/PillarLinks.swift`](../pillar/src/Pillar/Utilities/PillarLinks.swift).
Change a filename here and you change it there.

## Keep these in sync with the app

These pages make promises the app has to keep. When any of the following changes, the page
changes in the same commit:

- **Prices, the trial, or what the free tier includes** → `subscription-terms.html` §1–§4.
  Today it says: free = one session per day + Today; Premium = unlimited sessions, Pomodoro,
  full Insights and history, all sounds, widgets. **The app does not gate any of this yet.**
- **What we send to PostHog** → `privacy-policy.html` §4 is a complete, itemised list of the
  events in `PillarAnalytics.swift`. Add an event, add a row.
- **Any new permission, SDK or third party** → `privacy-policy.html` §1 and §7.
- **Minimum iOS or supported AirPods** → `index.html` and `support.html`.

## Deploy

Local preview (from the repo root, via the Browser pane's `pillar-site` launch config, or):

```bash
python3 -m http.server 8911 --directory pillar-site
```

First deploy — the repo has to live under the **same GitHub account that already serves
`glowd.tech`** (`makslearnsprompts`), because GitHub blocks subdomains of a verified domain
for other accounts:

```bash
gh repo create makslearnsprompts/pillar-site --public --source=. --remote=origin --push
```

Then in the repo's **Settings → Pages**: source `main` / root, custom domain
`pillar.glowd.tech`, and tick *Enforce HTTPS* once the certificate is issued.

DNS, one record at GoDaddy (`glowd.tech` nameservers are `ns27/ns28.domaincontrol.com`):

```
CNAME   pillar   makslearnsprompts.github.io
```

`CNAME` in this folder must keep saying `pillar.glowd.tech` — GitHub reads it as the custom
domain, and removing it unsets the domain. `.nojekyll` keeps Jekyll from eating paths that
start with an underscore, which the onboarding OTA bundles under `/b/` will need later
(see `docs/web-onboarding/ARCHITECTURE.md` §7).

Verify after DNS propagates:

```bash
curl -sI https://pillar.glowd.tech/privacy-policy.html | head -1
```

## Legal review

These pages were drafted against what the code actually does, not from a generic template,
and they include the Apple-specific clauses a custom EULA needs (guideline 3.1.2 and Apple's
Licensed Application End User License Agreement schedule: Apple is not a party, has no
support obligation, and is a third-party beneficiary). They are still not a lawyer's work.
Before submission, at minimum confirm: the legal entity named in the pages matches your App
Store Connect seller, the governing-law clause suits where you actually are, and the prices
match the SKUs in App Store Connect.
