# Asset Registry

Every externally sourced asset used in this project, with its source and license.
Everything else (characters, card artwork, boards, effects, UI, sounds synthesized
with the Web Audio API) is original in-house work.

## Fonts

| Asset | Source | URL | License | Attribution | Used By |
|---|---|---|---|---|---|
| Baloo 2 (variable woff2, latin + latin-ext) | Google Fonts | https://fonts.google.com/specimen/Baloo+2 | OFL 1.1 | Not required | Body UI / text |
| Lilita One (woff2, latin + latin-ext) | Google Fonts | https://fonts.google.com/specimen/Lilita+One | OFL 1.1 | Not required | Display headings / logo |

Files bundled locally at `public/assets/fonts/` (`baloo2-latin.woff2`,
`baloo2-latin-ext.woff2`, `lilita-latin.woff2`, `lilita-latin-ext.woff2`).

## Audio

None externally sourced yet. Current SFX are synthesized at runtime with the
Web Audio API (see `src/audio/SoundManager.ts`). If CC0 Kenney audio is added
later, it will be registered here and placed in `public/assets/audio/`.

## Images / textures / sprites

None. All graphics are inline SVG/CSS components under `src/`.

---

## Design notes

- Character system: original design (`src/components/characters/`). Inspired by
  the general arcade party-game genre (e.g. the Kenney art feed), but drawn from
  scratch — no copyrighted characters, logos, or game assets are copied.
- Card artwork: original SVG scenes (`src/components/cards/CardArt.tsx`).
- License verification: Google Fonts OFL 1.1 permits bundling, modification, and
  commercial use without attribution, provided the license text is retained.
