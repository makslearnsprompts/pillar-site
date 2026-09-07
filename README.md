# pillar-site

The public pages for the Pillar iPhone app, served as a static GitHub Pages site at
**https://pillar.glowd.tech**.

Two of these pages are required to submit the app: App Store Connect will not accept a
build without a Privacy Policy URL and a Support URL, and Apple's guideline 3.1.2 requires a
working link to the subscription terms on the purchase screen.

| File | URL | Used as |
|---|---|---|
| `index.html` | `/` | App Store *Marketing URL* |
| `privacy-policy.html` | `/privacy-policy.html` | App Store *Privacy Policy URL*, You tab |
| `terms-of-use.html` | `/terms-of-use.html` | App Store *EULA / Terms*, You tab, paywall |
| `subscription-terms.html` | `/subscription-terms.html` | Paywall link, You tab |
| `support.html` | `/support.html` | App Store *Support URL*, You tab |

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
