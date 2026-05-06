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

function pathToAliasString(segments: PathSegment[]): string {
  return segments
    .filter((s): s is { kind: "key"; name: string } => s.kind === "key")
    .map((s) => s.name)
    .join(".");
}

export function buildSelect(
  paths: PathSegment[][],
  table: string,
): string {
  if (paths.length === 0) return `SELECT *\nFROM ${table};`;
  const used = new Set<string>();
  const lines = paths.map((p) => {
    const expr = pathToSqlExpression(p);
    let alias = sanitizeAlias(pathToAliasString(p));
    let candidate = alias;
    let n = 2;
    while (used.has(candidate)) candidate = `${alias}_${n++}`;
    used.add(candidate);
    return `  ${expr} AS ${candidate}`;
  });
  return `SELECT\n${lines.join(",\n")}\nFROM ${table};`;
}

// Walk JSON and emit a flat list of leaf-ish paths.
// Objects are flattened to dot paths. Arrays of objects are recursed into (using [OFFSET(0)]).
// Arrays of primitives or empty arrays are kept as a single column.
export function flattenForSelect(value: unknown, base: PathSegment[] = []): PathSegment[][] {
  const out: PathSegment[][] = [];
  if (value === null || typeof value !== "object") {
    out.push(base);
    return out;
  }
  if (Array.isArray(value)) {
    if (
      value.length > 0 &&
      value[0] !== null &&
      typeof value[0] === "object" &&
      !Array.isArray(value[0])
    ) {
      return flattenForSelect(value[0], [...base, { kind: "index", index: 0 }]);
    }
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
    if (v !== null && typeof v === "object") {
      out.push(...flattenForSelect(v, next));
    } else {
      out.push(next);
    }
  }
  return out;
}
