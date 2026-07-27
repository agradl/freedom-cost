# AGENTS.md — Freedom Cost

A single-user tool that prices spending decisions in **time until retirement**. Baseline answers when you hit the number; two levers show what a one-time purchase and a change in monthly rate each cost in days of freedom. Product intent and scope: [`idea.md`](./context/idea.md).

## Architecture (high level)

Static client app — no backend. Three layers:

1. **Engine** — pure TypeScript: baseline + overlays → retirement date, series, purchase future value / days deferred
2. **UI** — timeline as the spine; purchase and monthly-rate levers as live overlays; baseline knobs in a panel
3. **Persist** — `localStorage` (optional JSON export/import); load real baseline on open

Stack: Vite + React + TypeScript; charts via Observable Plot or uPlot; plain CSS. Money is always today’s dollars (real return only).

Details, engine contract, viz model, and out-of-scope: [`context/architecture.md`](context/architecture.md).  
Build order (engine → chart → levers → form/persist → honesty → mobile): [`context/build.md`](context/build.md).
