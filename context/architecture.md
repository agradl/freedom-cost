# Architecture: Freedom Cost

A single-page client web app. No backend, no accounts, no sync. The product stops at two levers and one timeline; the architecture stops there too.

## Shape

```
┌─────────────────────────────────────┐
│  UI (React + responsive layout)     │
│  Timeline viz · levers · knobs      │
└──────────────┬──────────────────────┘
               │ inputs / overlays
┌──────────────▼──────────────────────┐
│  Engine (pure TS, no React)         │
│  baseline → date · purchase cost ·  │
│  rate shift · P/E/O return band     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Persist (localStorage / JSON)      │
│  baseline defaults for this user    │
└─────────────────────────────────────┘
```

Three layers only:

1. **Engine** — pure functions: assets, real return, work income-by-year, spending, ages, Social Security, remaining-assets floor, optional overlays → retirement date + chart series. Testable without a browser.
2. **UI** — timeline as the spine; purchase amount and monthly rate as live overlays; baseline knobs in a panel/drawer.
3. **Persist** — load real baseline on open. `localStorage` is enough; optional export/import JSON for backup without a server.

## Tech

| Layer | Choice | Why |
|--------|--------|-----|
| App | Vite + React + TypeScript | Fast, boring, solid mobile tooling |
| Charts | Observable Plot or uPlot | Timeline + a few series; not a dashboard kit |
| Styling | CSS modules or plain CSS | One composition, no design-system project |
| Deploy | Static host (Cloudflare Pages / Netlify / GitHub Pages) | Zero ops |
| Backend | None | Math is local; single user |

Skip Next.js, auth, databases, and state libraries. React `useState` plus a small context (or Zustand if forms get noisy) is enough. Svelte + Vite is an equally valid alternative if preferred.

Optional later: PWA (service worker + manifest) for offline phone use on the same static build. Not required for v1.

## Visualization model

The chart is the app, not a widget.

- **X:** years from today → retirement (and a bit past)
- **Y:** portfolio in today’s dollars climbing toward the target
- **Baseline series** always visible
- **Overlay series** for purchase and/or rate change; date markers slide
- **Band** for pessimistic / expected / optimistic return (three curves or shaded range)

**Mobile:** full-bleed timeline first; levers as sticky bottom controls or bottom sheet; baseline knobs behind an Assumptions disclosure.

**Desktop:** timeline dominant; levers beside or under it; knobs in a side panel.

## Engine contract

```ts
type Inputs = {
  assets: number
  realReturn: number          // default 0.04
  incomeByYear: number[]      // after-tax work income; last year carries forward
  spendingAnnual: number      // constant real spending
  currentAge: number          // default 41
  deathAge: number            // default 95
  ssAge: number               // default 65
  ssMonthly: number           // default 4152
  targetRemainingAssets: number // portfolio floor at death; default 0
}

type Overlay = {
  oneTimePurchase?: number
  monthlyDelta?: number
  permanent?: boolean         // persists into retirement; can lower target
}

type Result = {
  retireYear: number          // years from today; month-aligned (k/12)
  target: number              // nest egg required at the solved retirement age
  series: { year: number; balance: number }[]  // yearly samples for the chart
  purchaseFutureValue?: number
  daysDeferred?: number
}
```

**Target** is not configured. It is the nest egg needed at a candidate retirement age so that constant real spending until `deathAge`, net of Social Security once `ssAge` is reached, still leaves `targetRemainingAssets` at death (discounted at real return). Retirement is the first **month** the portfolio meets that nest egg; `retireYear` is that offset in years (`months / 12`). Permanent spending changes alter retired spend and therefore the nest egg.

Run three returns (e.g. 2% / 4% / 6%) for the honesty band. Permanent vs temporary spending is one boolean on the overlay — not a second spending model.

Money is always **today’s dollars**; expected real return only (no separate inflation knob).

## Out of scope (architecture)

- Accounts, sync, multi-user
- Inflation path, tax engine, Monte Carlo
- Year-varying spending, multiple accounts
- Heavy component libraries that fight a single-composition UI
- Microservices, workers, analytics platforms

## North star

Math you can trust, a timeline that moves, two levers that make one-time vs rate asymmetry visceral — and nothing that only makes sense if this becomes a product for strangers.
