# Brand - FundWise

_Status: active_

FundWise uses the **Strata** logo system from [`brand-strata/`](./brand-strata/). The mark is three stacked, slightly angled rounded slabs in the FundWise green gradient. It represents layered Group money: expenses, settlements, and future treasuries.

## Logo

- Primary mark: Strata gradient mark.
- Header lockup: Strata mark plus `FundWise` wordmark in DM Serif Display.
- Footer lockup: smaller Strata mark plus text wordmark.
- Hero usage: keep the Strata mark as a subtle oversized layer watermark behind the main copy. Do not place a second foreground logo in the hero; the header lockup is the primary visible logo.
- Favicon/app icon: Strata SVG assets copied to [`public/brand-strata/svg/`](./public/brand-strata/svg/).

Use [`components/fundwise-logo.tsx`](./components/fundwise-logo.tsx) for app UI instead of hand-drawing inline logos.

## Palette

The brand has two parallel palettes, anchored by mode:

- **Split = greens** (primary brand, default mark)
- **Fund = navy blues** (Fund-mode surfaces only)

The mode chip is the single visual anchor — green for Split, blue for Fund, never both.

### Greens (Split + primary)

| Token             | Light     | Dark      | Use                                |
| ----------------- | --------- | --------- | ---------------------------------- |
| `green-deep`      | `#0A4D2C` | `#0D6B3A` | Gradient anchor, never large fills |
| `green-forest`    | `#0D6B3A` | `#1A9151` | Primary gradient start             |
| `green-mid`       | `#1A9151` | `#3DC880` | CTA bg, link, accent               |
| `green-fresh`     | `#2DB870` | `#5BD898` | Gradient end, focus ring           |
| `green-mint`      | `#4EC98A` | `#7DDFA8` | Soft accent                        |
| `green-light`     | `#72D4A0` | `#86E0AE` | Hover, light surface accent        |
| `green-pale`      | `#E6F7EE` | `#0F2418` | Background tints, badges           |

### Blues (Fund mode)

| Token            | Light     | Dark      | Use                       |
| ---------------- | --------- | --------- | ------------------------- |
| `blue-deep`      | `#0F2466` | `#0B1E4D` | Gradient anchor           |
| `blue-mid`       | `#2A4FA8` | `#2A4FA8` | Fund CTA, mode chip       |
| `blue-fresh`     | `#4671D8` | `#6A8FE8` | Gradient end              |
| `blue-pale`      | `#EEF2FC` | `#101A33` | Fund surface bg           |
| `blue-border`    | `#B6C8EF` | `#2A3D6E` | Fund card border          |

### Neutrals + ink

| Token         | Light     | Dark      | Use                              |
| ------------- | --------- | --------- | -------------------------------- |
| `bg`          | `#FBFCF9` | `#06100B` | Page bg                          |
| `surface`     | `#F5FAF6` | `#0D1A14` | Card bg                          |
| `surface-2`   | `#EAF3EC` | `#13241D` | Inset, sidebar                   |
| `border`      | `#D5E8DA` | `#1B2D24` | Default border                   |
| `border-2`    | `#C0D9C7` | `#2A4438` | Strong border                    |
| `ink`         | `#0D1F14` | `#F2F8F3` | Primary text                     |
| `ink-2`       | `#4A6B55` | `#A7BEAD` | Secondary text                   |
| `ink-3`       | `#8DAB97` | `#6B8378` | Tertiary text, captions          |

### Semantics + premium gold

| Token         | Light     | Dark      | Use                                       |
| ------------- | --------- | --------- | ----------------------------------------- |
| `red`         | `#C73B3B` | `#E15A5A` | Destructive, owed, declined               |
| `red-pale`    | `#FBECEC` | `#2A1414` | Destructive surface                       |
| `amber`       | `#D88A2C` | `#E6A050` | Warning, pending                          |
| `amber-pale`  | `#FBF1DC` | `#2A1F10` | Warning surface                           |
| `gold`        | `#B8852A` | `#E8C77A` | Fund-mode premium accent (locked, vault)  |
| `gold-pale`   | `#FBF4E0` | `#2A2418` | Gold surface tint                         |

### Gradients

- `--brand-grad` — Split brand gradient (forest → fresh), light and dark variants
- `--brand-fund-grad` — Fund three-stop navy gradient (deep → mid → fresh)
- `--brand-fund-grad-soft` — Fund two-stop softer variant

Use via utility classes: `bg-brand-grad`, `text-brand-grad`, `bg-brand-fund-grad`, `text-brand-fund-grad`, `bg-brand-fund-grad-soft`.

## Theming

Tokens are CSS custom properties on `:root` (light) and `.dark` (dark). Theme is managed by `next-themes` via `<ThemeProvider>` in [`components/providers.tsx`](./components/providers.tsx). Toggle UI is [`components/theme-toggle.tsx`](./components/theme-toggle.tsx) (already in the Header).

Tailwind utilities resolve through `@theme inline` mappings in [`app/globals.css`](./app/globals.css) — `bg-brand-surface`, `text-brand-ink`, `border-brand-border-c`, `bg-brand-fund-blue-bg`, etc. all theme automatically.

## Rules

- Do not stretch or recolor the mark outside the palette.
- Do not add drop shadows to the mark.
- Keep at least half the mark height as clear space where possible.
- Use the simplified favicon SVG below 24px.
- Never mix green and blue accents on the same surface — pick one mode and commit.
- Gold is reserved for Fund-mode premium states (vault locked, threshold met).
