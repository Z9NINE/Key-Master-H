# Key Master design system

The full brand book (type, color, spacing, components and their previews) lives in the Key Master design system artifact. This page is the short version for anyone editing `index.html`.

## One rule

Every size is derived from the body size and one ratio per screen edge:

- **Type**: step *n* = 16px × 1.15ⁿ at 360px wide, 17px × 1.25ⁿ at 1440px, fluid in between (`--step-m1` … `--step-7`).
- **Space**: multiples of the body size (`--space-3xs` 0.25× … `--space-3xl` 6×), plus fluid pairs such as `--space-m-l` (24px on a phone growing to 34px on desktop).
- **Sizes**: also multiples of the body size (`--size-control` 3×, `--size-badge` 2.5×, `--size-icon` 4×, `--size-logo` 8×).

To change the system, edit the numbers at the top of `design/scale.mjs`, run it, and paste its output over the matching tokens in the `:root` block of `index.html`:

```bash
node design/scale.mjs
```

## Working in the CSS

- Components use **role tokens**, never raw steps or pixel values: `--type-display`, `--type-title-1/2/3`, `--type-lead`, `--type-body`, `--type-small`; `--gap-after-title`, `--gap-block`, `--pad-card`, `--pad-panel`, `--section-space` and so on. They are defined and commented in the `:root` block.
- Two elements with the same role look the same. If nothing fits, add a role token to `:root` and document it, rather than a one-off value.
- Colors are tokens with light and dark values; text on gold is always `--on-accent`.
- The hero headline is fitted to its column per language with `--display-fit` (the longest line's width in em). If you change the headline text, re-measure it.

## Checks

The page was verified with no horizontal overflow in English, Spanish and Chinese at 360, 390, 520, 821, 1024 and 1440px, and all text colors meet WCAG AA on their backgrounds in both themes.
