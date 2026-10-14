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
- Some text is fitted to its column per language: the hero headline (`--display-fit`), the service-panel titles (`--title-fit`) and the panel bullet lists (`--list-fit`). Each value is the longest line's width in em, so that text always stays on one line. If you change that text, re-measure it.
- Paired titles (the car-keys and house-keys panels) are written to similar lengths in every language, and both panels share one grid cell, so switching tabs never changes the page length.
- Space is measured from what the eye sees: a photo between text and a rule gets the paragraph's half-leading plus descent added below it, so it looks equally far from both. On wide screens the contact panel's top padding equals the photo's gap to the details below.
- Keep "El Monte" together with a no-break space (U+00A0) in regular text. Charter Bold has no no-break space and the browser substitutes a wider one, so bold text must not rely on it: the address is two lines (street, then city). A word joiner does not stop a break at a space.

## Checks

The page was verified with no horizontal overflow in English, Spanish and Chinese at 360, 390, 520, 821, 1024 and 1440px, and all text colors meet WCAG AA on their backgrounds in both themes.
