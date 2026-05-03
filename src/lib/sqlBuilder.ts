// SQL helpers for BigQuery / Snowflake style dot-notation paths.

export type PathSegment = { kind: "key"; name: string } | { kind: "index"; index: number };

export function pathToDotString(segments: PathSegment[]): string {
  // Used as a stable identifier (e.g. for selection set & alias generation).
  return segments
    .map((s) => (s.kind === "key" ? s.name : `[${s.index}]`))
    .join(".")
    .replace(/\.\[/g, "[");
}

export function pathToSqlExpression(segments: PathSegment[]): string {
  // BigQuery: nested struct fields via dot, arrays via [OFFSET(i)]
  let out = "";
  for (const seg of segments) {
    if (seg.kind === "key") {
      out += out ? "." + quoteIdentIfNeeded(seg.name) : quoteIdentIfNeeded(seg.name);
    } else {
      out += `[OFFSET(${seg.index})]`;
    }
  }
  return out;
}

function quoteIdentIfNeeded(name: string): string {
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return name;
  return "`" + name.replace(/`/g, "\\`") + "`";
}

export function sanitizeAlias(raw: string): string {
  let s = raw.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  s = s.replace(/_+/g, "_");
  if (!s) s = "col";
  if (/^[0-9]/.test(s)) s = "_" + s;
  return s;
}

export function buildSelect(
  paths: PathSegment[][],
  table: string,
): string {
  if (paths.length === 0) return `SELECT *\nFROM ${table};`;
  const used = new Set<string>();
  const lines = paths.map((p) => {
    const expr = pathToSqlExpression(p);
    let alias = sanitizeAlias(pathToDotString(p));
    let candidate = alias;
    let n = 2;
    while (used.has(candidate)) candidate = `${alias}_${n++}`;
    used.add(candidate);
    return `  ${expr} AS ${candidate}`;
  });
  return `SELECT\n${lines.join(",\n")}\nFROM ${table};`;
}

// Walk JSON and emit a flat list of leaf-ish paths.
// Objects are flattened to dot paths. Arrays are kept as a single column (no UNNEST).
export function flattenForSelect(value: unknown, base: PathSegment[] = []): PathSegment[][] {
  const out: PathSegment[][] = [];
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    out.push(base);
    return out;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length === 0) {
    out.push(base);
    return out;
  }
  for (const k of keys) {
    const v = obj[k];
    const next: PathSegment[] = [...base, { kind: "key", name: k }];
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      out.push(...flattenForSelect(v, next));
    } else {
      out.push(next);
    }
  }
  return out;
}
