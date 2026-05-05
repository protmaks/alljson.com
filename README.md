# AllJSON

A browser-based tool for validating JSON, exploring its structure, and generating SQL from it.

Live: https://alljson.com

All processing happens locally in the browser. No data is uploaded.

## Features

- Strict and lenient JSON validation. The lenient parser accepts unquoted keys, trailing commas, single-quoted strings, JavaScript-style comments, and the bare values `undefined`, `NaN`, and `Infinity`.
- Editor with line numbers. The line containing a parse error is highlighted and scrolled into view.
- One-click formatting (pretty-print) and copy.
- Interactive JSON tree with key filtering and expand/collapse all.
- SQL builder. Tick checkboxes in Select mode to add fields to a `SELECT` statement using dot-notation paths (BigQuery / Snowflake style, with `[OFFSET(i)]` for arrays).
- Flatten-everything SQL generates automatically as soon as the JSON is valid.
- Input and mode persist in `localStorage`.

## Tech stack

- Vite, React 18, TypeScript
- Tailwind CSS, shadcn/ui
- lucide-react, sonner
- Deployed to GitHub Pages via GitHub Actions

## Getting started

```bash
npm install
npm run dev        # development server
npm run build      # production build
npm run preview    # preview the production build
```

## Project structure

```
src/
├── components/
│   ├── JsonTree.tsx
│   ├── LineNumberedTextarea.tsx
│   ├── RobotEyeLogo.tsx
│   └── ui/
├── lib/
│   ├── lenientJson.ts            # lenient JSON parser
│   └── sqlBuilder.ts             # JSON path to SQL generator
└── pages/
    ├── Index.tsx
    ├── About.tsx
    └── NotFound.tsx
```

## Deployment

Deployment is handled by `.github/workflows/deploy.yml`. In the repository
settings, under Pages, the source must be set to "GitHub Actions". The custom
domain is configured via `public/CNAME`.

## License

MIT
