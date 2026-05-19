# GhostPay — Brand Identity

> *Get paid without getting watched.*

---

## 01 · Brand Essence

GhostPay sits at the intersection of **privacy** and **trust**. It must feel premium enough for a freelance designer to send a client invoice, discreet enough for a DAO contributor receiving a bounty, and clean enough that payers never hesitate to click Pay.

The brand is not shadowy or threatening. It is composed. Like a well-designed private bank — visible only when you need it, invisible to everyone else.

**Brand personality:**
- Quietly confident, never boastful
- Premium but not cold
- Transparent about privacy (honest, not vague)
- Solana-native but not crypto-bro

---

## 02 · Logo & Wordmark

**Wordmark:** `GhostPay` — set in Cormorant Garamond SemiBold. The `G` is optionally stylised with a subtle cut or fade on the tail to hint at the ghost/disappearance concept without being literal.

**Symbol:** An abstract mark — a circle with an upward fade (opacity gradient from solid at the base to near-transparent at the crown). Works as a favicon and app icon. Think: a presence that dissolves.

**Logo on light:** Pine `#2C4A3E` wordmark + symbol
**Logo on dark:** Ivory `#F7F4EF` wordmark + symbol

**Don'ts:**
- Never use a cartoon ghost
- Never use an eye-with-slash icon
- Never render the logo in gradient

---

## 03 · Color System

### Primary Palette

| Token | Hex | Usage |
|---|---|---|
| `ghost-ivory` | `#F7F4EF` | Page background (primary) |
| `ghost-cream` | `#EDE9E2` | Card surfaces, input fields |
| `ghost-pine` | `#2C4A3E` | Primary brand, CTAs, active states |
| `ghost-sage` | `#4A7C6B` | Hover states, secondary actions |
| `ghost-mist` | `#8FA89F` | Borders, dividers, placeholders |

### Accent Palette

| Token | Hex | Usage |
|---|---|---|
| `ghost-gold` | `#C9A96E` | Premium highlights, receipts, "claimed" state |
| `ghost-sand` | `#D4C4A8` | Warm neutrals, tags, metadata |

### Text

| Token | Hex | Usage |
|---|---|---|
| `ghost-ink` | `#1A1917` | Primary text |
| `ghost-smoke` | `#6B6560` | Secondary text, labels |
| `ghost-veil` | `#A8A49F` | Placeholder, disabled |

### Semantic

| Token | Hex | Usage |
|---|---|---|
| `ghost-confirmed` | `#2C4A3E` (pine) | Payment confirmed / claimable |
| `ghost-pending` | `#C9A96E` (gold) | Awaiting / pending states |
| `ghost-error` | `#8C3A2F` | Error, failed payment |
| `ghost-success` | `#3A6B4A` | Claimed / completed |

### Usage rules
- Never use pure `#000` or `#FFF` — always use the warm near-black / warm white
- The CTA is always Pine on Ivory — never invert this unless using a dark surface card
- Gold is a *reward* color only — use it for claimed/success moments, not navigation

---

## 04 · Typography

### Fonts

| Role | Family | Weight | Source |
|---|---|---|---|
| Display / Headings | Cormorant Garamond | 400, 600 | Google Fonts |
| UI / Body | Plus Jakarta Sans | 400, 500, 600 | Google Fonts |
| Code / Addresses | DM Mono | 400 | Google Fonts |

### Type Scale

| Name | Family | Size | Weight | Leading | Usage |
|---|---|---|---|---|---|
| `hero` | Cormorant Garamond | 52px | 400 | 1.1 | Landing headline |
| `display` | Cormorant Garamond | 36px | 400 | 1.15 | Page titles |
| `title` | Cormorant Garamond | 24px | 600 | 1.2 | Section headings |
| `heading` | Plus Jakarta Sans | 18px | 600 | 1.3 | Card headings |
| `body` | Plus Jakarta Sans | 15px | 400 | 1.65 | Body copy |
| `label` | Plus Jakarta Sans | 13px | 500 | 1.4 | Form labels, metadata |
| `caption` | Plus Jakarta Sans | 12px | 400 | 1.4 | Captions, tiny labels |
| `mono` | DM Mono | 13px | 400 | 1.5 | Wallet addresses, tx hashes, codes |

### Typography rules
- Headings lean on Cormorant to feel editorial and premium
- All UI interactions (buttons, labels, statuses) use Plus Jakarta Sans — never serif for interactive elements
- Wallet addresses always DM Mono — never try to render them in a proportional font
- Letter-spacing: `+0.02em` on all-caps labels (e.g. `STATUS`, `USDC`)
- Numbers in Cormorant are especially beautiful — use the display scale for amounts in checkout

---

## 05 · Spacing & Layout

### Base unit: 4px

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Tight internal gaps |
| `space-2` | 8px | Inline gaps, icon spacing |
| `space-3` | 12px | Small component padding |
| `space-4` | 16px | Standard padding |
| `space-6` | 24px | Card padding |
| `space-8` | 32px | Section spacing |
| `space-12` | 48px | Large section spacing |
| `space-16` | 64px | Page section gaps |

### Border radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 6px | Badges, pills, tags |
| `radius-md` | 10px | Buttons, inputs |
| `radius-lg` | 16px | Cards, modals |
| `radius-xl` | 24px | Large feature cards |

### Borders

Always `1px` — never thicker. Ghost uses thin, refined lines.

| Token | Usage |
|---|---|
| `mist` at 50% opacity | Default card border |
| `mist` at 100% | Focused input, active card |
| `pine` at 100% | Primary action outline |

---

## 06 · Component Patterns

### Payment card (checkout)
- Warm ivory background
- Large Cormorant amount (48–64px, the number is the hero)
- Merchant name in label caps above the amount
- Pine CTA button, full-width, 52px height, rounded-md
- "Protected by Umbra" badge at the bottom in pine/sage tones

### Status pills

| State | Background | Text | Border |
|---|---|---|---|
| Active | Pine 10% | Pine | Pine 30% |
| Pending | Gold 15% | `#8A6A30` | Gold 40% |
| Claimable | Sage 15% | `#2C5A4A` | Sage 40% |
| Claimed | Sand 20% | Smoke | Sand 50% |
| Expired | Cream | Veil | Mist |
| Failed | Error 10% | Error | Error 30% |

### Buttons

| Variant | Background | Text | Border |
|---|---|---|---|
| Primary | Pine | Ivory | — |
| Secondary | Transparent | Pine | Pine |
| Ghost | Transparent | Smoke | Mist |
| Danger | Error 10% | Error | Error 30% |

All buttons: 52px height on desktop, 48px on mobile. Corner radius `radius-md`.

---

## 07 · Motion & Micro-interactions

**Principles:**
- Motion is for confirmation, not decoration
- Transitions are fast: 150–200ms for state changes, 300ms for page entrances
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` — snappy feel
- Never animate things that aren't changing state

**Key moments:**
| Moment | Animation |
|---|---|
| Pay button click | Button scale 0.97, background shifts from Pine to Sage, spinner in |
| Payment confirmed | Amount fades to gold, checkmark draws in, subtle upward lift |
| Link copied | Copy icon flicks to checkmark (200ms), reverses at 2s |
| Claim success | Receipt card slides up from below, gold shimmer sweeps across amount |
| Error state | Subtle shake (3 × ±4px), border flashes to error red |

---

## 08 · Iconography

**Icon set:** Phosphor Icons (thin weight — 1.5px stroke)

Reason: Phosphor thin icons feel premium and match the editorial typography. Heroicons and Lucide skew more utilitarian.

**Core icons used:**
- `eye-slash` — privacy indicator
- `link` — payment link
- `qr-code` — QR sharing
- `arrow-square-out` — external link / claim
- `receipt` — receipt page
- `shield-check` — Umbra protection badge
- `copy` — copy link
- `check-circle` — success/confirmed
- `clock` — pending/expiry
- `ghost` — used *once*, in the logo/brand mark area only

---

## 09 · Privacy Communication

How GhostPay talks about privacy:

### Say:
- *"Reduces public wallet exposure"*
- *"Your wallet graph stays private"*
- *"Routed through Umbra private transfers"*
- *"No direct sender-to-receiver link"*

### Don't say:
- *"Untraceable"*
- *"100% anonymous"*
- *"Impossible to identify"*
- *"Hidden from everyone"*

The Umbra badge copy: **"Payment routed privately via Umbra"** — not "hidden" or "secret."

---

## 10 · Brand Voice

| Context | Tone | Example |
|---|---|---|
| Marketing | Calm, confident, elegant | "Get paid without getting watched." |
| Checkout | Minimal, reassuring | "You are paying privately. The receiver won't see your wallet history." |
| Success | Warm, brief | "Payment sent. The receiver can now claim." |
| Error | Direct, calm | "Transaction failed. Try again or use a different wallet." |
| Dashboard | Functional, clear | "3 payments ready to claim." |

**Avoid:** Crypto slang (`wagmi`, `gm`, `ser`), banking stiffness, fear-based privacy framing.

---

## 11 · Dark Mode

GhostPay supports dark mode. The palette inverts elegantly:

| Light | Dark |
|---|---|
| `ghost-ivory` bg | `#171614` |
| `ghost-cream` surface | `#211F1D` |
| `ghost-pine` CTA | `#4A7C6B` (sage, softer) |
| `ghost-ink` text | `#EDE9E2` |
| `ghost-smoke` secondary | `#9A948E` |
| `ghost-gold` accent | `#D4B07A` |

The editorial warmth (cream/ivory) inverts to warm dark tones — never cold grey/black.

---

## 12 · What GhostPay is not

| ❌ Not this | ✓ But this |
|---|---|
| Shadowy / suspicious | Composed / discreet |
| Hacker aesthetic | Banker aesthetic |
| Purple crypto gradients | Warm ivory + pine |
| Loud / high-energy | Quiet / confident |
| Complex / overwhelming | One action at a time |
| Generic SaaS | Deliberately crafted |

---

*GhostPay Brand Identity v0.1 — Hackathon build*
