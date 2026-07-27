# Freedom Cost

A single-user tool that prices spending decisions in **time until retirement**.

Most retirement calculators ask whether you’ll have enough. This one asks what a purchase or a change in monthly spending costs you in days of freedom — and shows that cost on a timeline that moves.

## What it does

Everything reduces to three questions:

1. **Where do we stand?** Given assets, income, spending, and assumptions — when do we hit the number?
2. **What does this purchase cost?** Spend $X today instead of investing it — how much later do we retire, and what would that $X have grown to by then?
3. **What does our monthly rate cost?** Spend $Y less (or more) every month — how does the retirement date move?

One-time and recurring are different: a purchase loses its future compounded value; a monthly change alters the entire savings rate. The UI makes that asymmetry visceral — $500/month matters far more than a single $500 splurge.

### Mental model

- **Timeline (the spine)** — today on the left, retirement on the right, portfolio climbing toward a derived target. This is what moves.
- **Lever one — the moment** — enter a one-time purchase; see the date shift and the true cost (compounded future value, not sticker price).
- **Lever two — the rate** — change monthly spending and watch the date slide. Tag the change permanent (persists into retirement and can lower the nest-egg target) or temporary.

### Baseline you configure

- Starting assets and expected real return (default 4%)
- After-tax income by year (latest year carries forward)
- Constant annual spending in today’s dollars
- Current age, death age, Social Security claim age and monthly benefit
- Target remaining assets at death (the only residual floor)

The retirement nest egg itself is **computed**, not typed in: enough portfolio at retirement to fund spending until death, net of Social Security, and still leave the remaining-assets floor.

Money is always **today’s dollars**. There is no separate inflation knob — the return assumption is real (inflation already subtracted).

### Honesty touches

- Overlay series and date markers vs. the baseline
- Pessimistic / expected / optimistic return band around the timeline
- Permanent vs. temporary rate changes so cuts that would end anyway don’t fake progress

## Stack

Static client app — no backend, no accounts.

- **Engine** — pure TypeScript: baseline + overlays → retirement date, series, purchase future value / days deferred
- **UI** — React + Vite + TypeScript; timeline chart with live levers; baseline knobs in a form
- **Persist** — `localStorage`, plus optional JSON export/import; optional gitignored `defaults.local.ts` for your real baseline on open

## Develop

```bash
npm install
npm run dev
```

```bash
npm test
npm run build
```

To open on your numbers instead of the built-in fallbacks, copy `src/persist/defaults.local.example.ts` to `src/persist/defaults.local.ts` (gitignored) and edit.

## Project docs

Deeper product and architecture notes live under [`context/`](./context/):

- [`context/idea.md`](./context/idea.md) — intent, scope, and the three questions
- [`context/architecture.md`](./context/architecture.md) — layers, engine contract, out of scope
