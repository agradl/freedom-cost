# Idea: Freedom Cost

A tool that translates spending decisions — a single purchase now, or a change to your monthly rate — into the currency that actually matters: **time until retirement**. Every dollar has a visible cost measured in days of life not yet free.

Most retirement calculators answer "will I have enough?" This answers "what did that cost me in freedom?" That framing is the north star. Every feature either serves it or gets cut.

## Who it's for

The primary user is **you** — a builder who wants to open the hood and tune assumptions. The product is a tunable instrument first: precise inputs, honest outputs, assumptions you can inspect and change.

The shared conversation with a partner is a valuable side effect of a clear timeline and two levers, not the design center. Prefer depth and control over dead-simple defaults that hide how the number was made.

## The three questions

Everything reduces to these:

1. **Where do we stand?** Given assets, income, spending, and assumptions — when do we hit the number? (The baseline.)
2. **What does this purchase cost?** If we spend $X today instead of investing it, how much later do we retire — and what would that $X have grown to by then? (The one-time lens.)
3. **What does our monthly rate cost?** If we spend $Y less (or more) every month, how does the retirement date move? (The recurring lens.)

One-time and recurring are genuinely different: a purchase loses its future compounded value; a monthly change alters the entire savings *rate*. The tool should make that asymmetry visceral — $500/month matters vastly more than a single $500 splurge.

## Mental model: two levers, one timeline

- **Timeline (the spine):** today on the left, retirement date on the right, savings climbing toward the target. This is the thing that moves.
- **Lever one — the moment:** "Should we buy this?" Enter an amount; see the retirement date shift and the true cost — compounded future value, not sticker price. A $3,000 couch isn't $3,000; it's ~$6,200 of retirement money and N days later.
- **Lever two — the rate:** Change monthly spending and watch the date slide. Turns "spend less" into a visible tradeoff.

If a feature doesn't plug into this model, it's scope creep.

## What you configure

Keep the knobs few. Defaults should load *your* real situation so the tool opens showing truth — but every input is meant to be opened and tuned.

**Baseline inputs:**
- Starting assets
- Expected real return (default 4%)
- After-tax income by year — take-home / investable income; enter as many near-term years as you care about; the **latest entered year becomes the default for all years beyond**
- Spending — a single constant rate for now (does not vary by year)
- Current age (default 41) and death age (default 95)
- Social Security claim age (default 65) and monthly benefit (default $4,152) — retirement-side income only
- Target remaining assets at death (default $0) — the only residual “floor”; the retirement nest egg itself is computed, not typed in

The retirement **target balance** is derived: enough portfolio at retirement to fund spending until death, net of Social Security, and still leave the remaining-assets floor.

**Session levers (overlays on the baseline):**
- One-time purchase amount
- Temporary change to the monthly rate (still vs. a flat spending assumption)

## Money units: today's dollars

Work entirely in **today's dollars**. There is no separate inflation input.

- The return assumption is an **expected real return** (default 4%) — inflation is already subtracted, not a second knob.
- Starting assets, after-tax income, and spending are all in current purchasing power.
- Constant spending means constant purchasing power, which is what “we spend $X” usually means.

A separate inflation rate only earns its keep once you model things sticky in *nominal* terms (e.g. fixed mortgages, bracket creep). Out of scope until then. If inflation is added later, it should convert into the same real math underneath — not introduce a competing nominal timeline.

## Honesty layer

Credibility depends on not flattering the user.

- **Permanent vs. temporary spending.** Cutting a subscription moves the date; "cutting" something that ends on its own before retirement does not. Let spending changes be tagged permanent (persists into retirement — and can lower the *target*, a double effect) or temporary (ends anyway). Permanent cuts should visibly move the date more, because they do.
- **Show fragility.** A single confident retirement date is a false promise. Prefer a range (pessimistic / expected / optimistic return). Same for near-term income: make the specified early years visibly load-bearing.
- **Resist the guilt trap.** "This purchase costs 4 days of freedom" is powerful and can curdle into every small pleasure feeling like a moral failure. The point isn't to spend nothing; it's to spend deliberately. Protect intentional categories (e.g. travel) so the tool sharpens reflexive spending without poisoning the intentional kind.

## Emotional job

The real function isn't computation — a spreadsheet computes. It's to make an abstract future tangible enough to change behavior at the moment of purchase, and to give a shared, neutral surface for tradeoffs. The math is the medium; clearer decisions are the product.

## Scope for v1

**In:** one household, one combined portfolio, today's (real) dollars throughout with no inflation knob, constant spending, year-tunable income (last year carries forward), the three questions above.

**Out:** separate inflation modeling, year-varying spending, detailed tax modeling, multiple accounts, Monte Carlo, kids' college as a separate module, single-stock concentration risk. Each is real; each is a rabbit hole. Ship two-levers-one-timeline first.
