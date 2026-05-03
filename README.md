# AllJSON

**Validate JSON, explore the tree, and build SQL from JSON — all in your browser.**

Live: [alljson.com](https://alljson.com)

AllJSON is a free, fast, browser-based tool for working with JSON. Nothing is uploaded — everything runs locally in your browser.

## Features

- ✅ **Strict & lenient JSON validation** — accepts unquoted keys, trailing commas, single quotes, comments, `undefined`/`NaN`/`Infinity`
- 🔢 **Line numbers** with the problematic line highlighted on parse errors (auto-scrolls into view)
- 🪄 **Format / pretty-print** JSON in one click
- 📋 **One-click copy** of the input, paths, and generated SQL
- 🌳 **Interactive JSON tree** with filter, expand/collapse all
- 🛠 **SQL builder** — pick fields from the tree to generate `SELECT` statements (BigQuery / Snowflake dot-notation, `[OFFSET(i)]` for arrays)
- 🔁 **Convert all to SQL** — flatten an entire JSON document into a SELECT
- 💾 **Persists** your input, table name, and mode in `localStorage`
- 📱 Responsive layout that uses the full height of the viewport

## Tech stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [lucide-react](https://lucide.dev/) icons, [sonner](https://sonner.emilkowal.ski/) toasts
- Deployed to GitHub Pages via GitHub Actions

## Getting started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

## Project structure

```
src/
├── components/
│   ├── JsonTree.tsx              # Interactive JSON tree
│   ├── LineNumberedTextarea.tsx  # Editor with line numbers + error highlight
│   ├── RobotEyeLogo.tsx          # Animated wordmark
│   └── ui/                       # shadcn/ui primitives
├── lib/
│   ├── lenientJson.ts            # Lenient JSON parser
│   └── sqlBuilder.ts             # JSON path → SQL generator
└── pages/
    ├── Index.tsx                 # Main app
    ├── About.tsx                 # About page
    └── NotFound.tsx
```

## Deployment

The app is deployed to GitHub Pages via the workflow in `.github/workflows/deploy.yml`. In repository **Settings → Pages**, set **Source** to **GitHub Actions**.

A custom domain (`alljson.com`) is configured via `public/CNAME`.

## License

MIT
