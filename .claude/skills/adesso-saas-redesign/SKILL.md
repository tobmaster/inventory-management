---
name: adesso-saas-redesign
description: Redesign a Vue 3 application's UI into a modern SaaS-style interface in the adesso SE look - left vertical sidebar navigation instead of a top nav bar, a consistent spacing scale, polished cards, tables, buttons and forms, plus subtle synthesized futuristic UI sound effects on buttons, navigation and feedback. Use when asked to restyle, modernize, re-skin or "make professional" a Vue app, move navigation to a sidebar, apply adesso style to an app, or add UI sounds.
---

# adesso SaaS Redesign for Vue 3

Turn an existing Vue 3 app into a bright, calm, professional SaaS interface that is recognizably adesso, with a left sidebar, one spacing system, and an optional layer of short synthesized UI sounds.

The redesign is visual. Do not change routes, API calls, data flow, filters or business logic. A user should be able to do exactly what they could before, in the same number of clicks.

## Assets in this skill

| File | Copy to | Purpose |
|---|---|---|
| `assets/tokens.css` | `client/src/styles/tokens.css` | Colors, type, spacing, radius, shadow, motion tokens plus base element styles |
| `assets/useSound.js` | `client/src/composables/useSound.js` | Web Audio sound engine, global click delegation, mute toggle |

Both are dependency-free. Sounds are synthesized at runtime, so there are no audio files and no licensing questions.

## Ground rules

1. **Brand.** Follow the `adesso-design` skill for color, type and icon rules. Load it if it is available. The short version:
   - adesso Blue `#006ec7` is solid only: no opacity, tints or gradients of it.
   - adesso Gray `#887d75` may be used in 10% steps. `tokens.css` precomputes them as solid colors on white.
   - Accent colors (green, turquoise, orange, pink, violet, yellow) are for highlights, chips and charts, never body text.
   - Bright and airy. No dark sci-fi themes, glows, neon, glassmorphism, or decorative blobs.
2. **Fonts.** Use Fira Sans (OFL) from Google Fonts or self-hosted. Use Klavika only if an adesso-approved source exists and the repo is private. Never commit Klavika or ABC Marist files, internal SharePoint/CELUM URLs, or the adesso logo to a public repo.
3. **Logo.** Do not recreate the adesso wordmark or its blue bar for the app's own brand. Show the app's own name in the sidebar header.
4. **Icons.** Thin outline icons only (1.5px stroke, 20px box, `currentColor`). Inline SVG or a free outline set such as Lucide. FontAwesome Thin is a Pro license, so do not add it unless the project already owns one.
5. **Repo conventions win.** Read `CLAUDE.md` first. In this repo:
   - Every `.vue` create or significant edit goes to the **vue-expert** subagent.
   - No emojis in the UI.
   - New user-facing strings go into every locale file (`client/src/locales/*.js`) through `t()`.
   - Update the **Design System** section of `CLAUDE.md` to the new tokens when you finish.
6. **Accessibility beats brand where they conflict.** adesso Gray on white is about 3.9:1, which fails WCAG AA for body text. Use `--text` (a darkened adesso gray) for body and table text, and `--text-muted` (adesso Gray) only for secondary labels at 13px and above. Keep visible focus rings and support keyboard navigation of the sidebar.

## Workflow

### 1. Audit (read only)
- Find the shell: usually `App.vue` (header, nav, `<router-view>`) and the router in `main.js`.
- Find the global styles: often an unscoped `<style>` in `App.vue`.
- List the hard-coded colors, font stacks and paddings across views and components:
  ```bash
  grep -rnoE "#[0-9a-fA-F]{3,6}\b|rgba?\([^)]*\)" client/src --include=*.vue | wc -l
  grep -rnoE "padding:[^;]+|margin:[^;]+|gap:[^;]+" client/src --include=*.vue | sort | uniq -c | sort -rn | head -30
  ```
- Note every nav item, header widget (language switcher, profile menu, filter bar) and modal, because each one needs a place in the new layout.
- Take "before" screenshots with Playwright at 1440x900 and 390x844.

### 2. Tokens
- Copy `assets/tokens.css` and import it once in `main.js` before mounting: `import './styles/tokens.css'`.
- Add Fira Sans to `index.html`:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  ```
- Replace hard-coded values in components with tokens: colors become `var(--...)`, spacing snaps to the `--space-*` scale, and radii and shadows use their tokens. Map the old status colors onto the `--status-*` tokens.

### 3. Shell layout: sidebar plus content
Target structure for `App.vue`:

```
.app-shell (CSS grid: [sidebar] var(--sidebar-w) [main] 1fr)
├── aside.sidebar (sticky, full height, white, right border --border)
│   ├── .sidebar-brand      app name, short subtitle
│   ├── nav.sidebar-nav     router-links: icon + label, grouped with small uppercase group labels
│   └── .sidebar-footer     sound toggle, language switcher, collapse button
└── .main
    ├── header.topbar       page title (from route meta), filter bar, profile menu
    └── main.content        <router-view />, max-width var(--content-max), padding var(--space-8)
```

Rules:
- **Sidebar sizing.** 248px expanded, 72px collapsed (icons only, label as `title` and `aria-label`). Persist the collapsed state in `localStorage` inside try/catch.
- **Active item.** adesso Blue text and icon, a 3px solid blue bar on the left edge, and a `--gray-10` background. Hover uses a `--gray-10` background only.
- **Grouping.** Group items logically, for example *Operations* (Overview, Inventory, Orders, Demand, Restocking) and *Finance* (Spending, Reports).
- **Under 960px.** The sidebar becomes an off-canvas drawer, a hamburger button appears in the topbar, and a scrim covers the content. Close the drawer on route change and on Escape.
- **Page titles.** Add `meta: { titleKey: 'nav.inventory', icon: 'box' }` to each route and render the topbar title from it instead of repeating headers in every view. Remove the now-duplicate `page-header` blocks only if the view's description text moves somewhere sensible.
- **Filter bar.** Keep it, styled as a compact row of selects in the topbar or directly under it. It stays global.

### 4. Components
Apply one style per element type everywhere:

| Element | Style |
|---|---|
| Card | `--surface` background, 1px `--border`, `--radius-lg`, `--shadow-sm`, padding `--space-6`; header row title 16px/600 in `--text`, actions on the right |
| KPI tile | Label 13px `--text-muted` uppercase with 0.04em tracking, value 28px/600 `--text`, optional delta chip; a 3px top border in one accent color per tile |
| Primary button | Solid `--brand` background, white text, `--radius-md`, height 40px, padding 0 `--space-5`; hover darkens with `--brand-hover` (a solid color, not opacity) |
| Secondary button | White background, 1px `--border-strong`, `--text` |
| Ghost button | Transparent background, `--brand` text, hover `--gray-10` |
| Table | Header 12px uppercase `--text-muted` on `--gray-10`; rows 48px; 1px `--border` dividers; hover row `--gray-10`; numbers right-aligned with `font-variant-numeric: tabular-nums` |
| Status chip | Pill with `--status-*-bg` background and `--status-*-fg` text, 12px/600 |
| Inputs and selects | 40px high, 1px `--border-strong`, `--radius-md`; focus shows a 2px `--brand` ring via `--focus-ring` |
| Modal | `--radius-lg`, `--shadow-lg`, scrim `rgba(30, 27, 24, 0.45)`, max-width 560px, header, body and footer separated by `--border` |
| Charts | Series colors from `--chart-1..6` (the brand palette in a fixed order); gridlines `--border`; axis labels `--text-muted` 12px |

Motion: 150-200ms `--ease` for hover and focus; 240ms for the drawer and modals. Wrap everything in `@media (prefers-reduced-motion: reduce)` overrides (already in `tokens.css`).

### 5. Sound effects
1. Copy `assets/useSound.js` to `client/src/composables/useSound.js`.
2. In `main.js`, after `app.mount('#app')`:
   ```js
   import { installUiSounds } from './composables/useSound'
   installUiSounds()
   ```
   This adds one delegated `pointerdown` listener on `document` that plays:
   - `tap` for `button`, `[role=button]`, `.btn`, `select` and checkboxes
   - `nav` for links inside `.sidebar-nav`
   You do not need to edit each component.
3. For semantic feedback, call `play()` explicitly where the outcome is known:
   ```js
   const { play } = useSound()
   try { await api.createSomething(); play('success') } catch (e) { play('error') }
   ```
   Other sounds: `open` and `close` for modals and drawers, and `toggle` for switches.
4. Opt elements out with `data-sound="off"`, or pick a sound with `data-sound="success"`.
5. Add a sound toggle in the sidebar footer, bound to `useSound().enabled`. Label it through `t('nav.sounds')` in every locale and give it `aria-pressed`.

Sound design rules (already built into the engine):
- **Short and quiet.** 40-220ms, master gain 0.12.
- **Synthesized only.** Sine and triangle tones with fast attack and exponential decay, plus one soft filtered-noise sweep for navigation.
- **No hover sounds.** They become tiring within a minute.
- **Throttled.** The same sound cannot fire more than once every 60ms.
- **Autoplay-safe.** The `AudioContext` is created lazily on the first user gesture, so nothing plays on page load.
- **Persistent mute.** The setting lives in `localStorage` (inside try/catch). Sounds are off when `prefers-reduced-motion: reduce` is set, unless the user turns them on explicitly.

### 6. Verify
- Run the app (`/start`) and check every route with Playwright at 1440x900 and 390x844. Take "after" screenshots next to the "before" ones.
- **Checks:**
  - No horizontal scroll at 390px.
  - The drawer opens and closes.
  - The active nav item matches the route.
  - Filters still change the data.
  - Modals open and close.
  - The language switch still works and every new string is translated.
- Check the console for errors with `browser_console_messages`.
- Search for leftovers: `grep -rnE "#0f172a|#64748b|#e2e8f0|Inter'" client/src` should return nothing after the migration, or only a deliberate exception.
- Run the **code-reviewer** subagent on the diff.

## Final checklist
- [ ] Left sidebar replaces the top nav; collapsible; drawer below 960px
- [ ] All colors come from tokens; adesso Blue appears only as a solid color
- [ ] Spacing uses only the `--space-*` scale
- [ ] Fira Sans loaded; no Klavika files or internal URLs committed
- [ ] Thin outline icons; no emojis
- [ ] Body text meets AA contrast (`--text`, not raw adesso Gray)
- [ ] Sounds: lazy context, quiet, throttled, mute toggle persisted, reduced-motion respected
- [ ] New strings translated in every locale
- [ ] No behavior change: same routes, data, filters and modals
- [ ] `CLAUDE.md` Design System section updated
