## AllJSON — JSON validator, tree explorer & SQL generator

A single-page static site (English UI) that hosts cleanly on GitHub Pages. Users paste raw or messy JSON / JSON-like text, get instant validation and a collapsible tree, then build BigQuery/Snowflake-style SQL paths by clicking fields.

### Layout

```
+---------------------------------------------------------------+
|  AllJSON                              [GitHub] [Docs]         |
+---------------------------------------------------------------+
|  INPUT (left)               |  TREE / OUTPUT (right)          |
|  -------------------------  |  -----------------------------  |
|  [ paste JSON here... ]     |  Mode: (•) Path  ( ) Select     |
|                             |  Table: [ my_table        ]     |
|  [Format] [Validate] [Clear]|  Path:  user.address.city  [Copy]|
|  Status: ✓ Valid JSON       |                                 |
|                             |  ▾ root {}                      |
|                             |   ▾ user {}                     |
|                             |     • id : 1                    |
|                             |     ▾ address {}                |
|                             |        • city : "Berlin" ←click |
|                             |   ▸ items [3]                   |
|                             |                                 |
|                             |  [Convert all to SQL] [Copy SQL]|
|                             |  ┌───────────── SQL ──────────┐ |
|                             |  | SELECT                     | |
|                             |  |   user.id          AS ...  | |
|                             |  |   user.address.city AS ... | |
|                             |  | FROM my_table              | |
|                             |  └────────────────────────────┘ |
+---------------------------------------------------------------+
```

### Core features

1. **Input & validation**
   - Large textarea for pasting JSON.
   - "Validate" → strict `JSON.parse`; on failure show line/column and message.
   - "Format" → pretty-print valid JSON (2-space indent).
   - **Lenient parser** for JSON-like text: handles trailing commas, single quotes, unquoted keys, JS comments, `undefined`/`NaN`. Tries strict first, falls back to lenient; shows a small "auto-fixed" notice.
   - Sample JSON button to try it out.

2. **Tree view**
   - Collapsible tree of objects/arrays with type badges (`{}`, `[n]`, string, number, bool, null).
   - Expand/collapse all controls; search filter for keys.
   - Each leaf and object key is clickable.

3. **Click behavior — toggle between two modes**
   - **Path mode (default):** clicking a field shows its dot path in a top bar (e.g. `user.address.city`) with a Copy button. Array elements use `[i]` (e.g. `items[0].name`); the SQL view shows the equivalent BigQuery form `items[OFFSET(0)].name`.
   - **Select mode:** clicking a field toggles it into a growing SELECT list. A live SQL preview updates as fields are added/removed; click an added field to remove it. "Clear selection" button.

4. **Convert all to SQL (flatten)**
   - One-click action that walks the JSON and emits dot-notation columns:
     ```
     SELECT
       user.id                 AS user_id,
       user.address.city       AS user_address_city,
       items                   AS items
     FROM my_table
     ```
   - Nested **objects** are flattened to dot paths with `_`-joined aliases.
   - **Arrays** are kept as the array column (no UNNEST), per chosen output style.
   - Configurable table name input (default `my_table`).
   - Copy-to-clipboard button on the SQL panel.

5. **Quality-of-life**
   - Persist last input + table name + mode in `localStorage`.
   - Toast notifications for copy/validate/errors (existing sonner).
   - Fully responsive; stacks vertically on mobile.

### Visual style
Light, clean, minimal. White background, subtle gray borders, one calm accent color for interactive elements (buttons, selected fields, current path). Monospace font only inside the JSON input, tree, and SQL output. Sans-serif everywhere else. Generous spacing, no heavy shadows.

### GitHub Pages hosting
- Pure static build (Vite). No backend, no env vars.
- Add `vite.config.ts` `base: './'` so assets resolve under `/<repo-name>/`.
- Add `public/404.html` that redirects to `index.html` for SPA deep-link safety (though the app is single-route).
- Include a short `README` section explaining: push to GitHub → Settings → Pages → Deploy from `gh-pages` branch or GitHub Actions. (User can also use Lovable's GitHub integration.)
- Optional: add a simple `.github/workflows/deploy.yml` that builds and publishes to `gh-pages` on push to `main`.

### Technical notes
- New files: `src/pages/Index.tsx` (full app), `src/lib/lenientJson.ts` (tolerant parser using regex pre-clean + `JSON.parse`, fallback to `Function`-based eval inside try/catch with strict whitelist), `src/lib/jsonTree.ts` (path/flatten helpers), `src/lib/sqlBuilder.ts` (BigQuery dialect emitter), `src/components/JsonTree.tsx`, `src/components/SqlPanel.tsx`, `src/components/PathBar.tsx`.
- Reuse shadcn `Button`, `Textarea`, `Input`, `Tabs`/`ToggleGroup`, `Card`, `Badge`, `ScrollArea`, `sonner` toaster.
- Identifier sanitization for SQL aliases: lowercase, non-alphanumeric → `_`, collapse repeats, prefix `_` if starts with digit.
- Update `index.html` title/description to "AllJSON — Validate JSON & build SQL".
- No new dependencies required.

### Out of scope (can be added later)
- UNNEST / CROSS JOIN expansion for arrays.
- Multiple SQL dialects (Postgres `->>`, MySQL `JSON_EXTRACT`).
- File upload / drag-and-drop.
- Schema inference / CREATE TABLE generation.
