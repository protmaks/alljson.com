// Lenient JSON parser: handles trailing commas, single quotes, unquoted keys,
// JS comments, and `undefined`/`NaN`/`Infinity`. Falls back from strict JSON.parse.

export type ParseResult =
  | { ok: true; value: unknown; lenient: boolean }
  | { ok: false; error: string; line?: number; column?: number };

function getLineCol(text: string, pos: number) {
  const upTo = text.slice(0, pos);
  const lines = upTo.split("\n");
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

function extractPosition(msg: string): number | null {
  const m = msg.match(/position (\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

function preClean(input: string): string {
  let s = input;
  // Strip block comments
  s = s.replace(/\/\*[\s\S]*?\*\//g, "");
  // Strip line comments (avoid hitting inside strings: simple heuristic walks chars)
  s = stripLineComments(s);
  // Replace bare undefined / NaN / Infinity with null (outside strings)
  s = replaceOutsideStrings(s, /\b(undefined|NaN|Infinity|-Infinity)\b/g, "null");
  // Convert single-quoted strings to double-quoted
  s = convertSingleQuotes(s);
  // Quote unquoted object keys
  s = quoteUnquotedKeys(s);
  // Remove trailing commas
  s = s.replace(/,(\s*[}\]])/g, "$1");
  return s;
}

function stripLineComments(s: string): string {
  let out = "";
  let inStr: string | null = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const n = s[i + 1];
    if (inStr) {
      out += c;
      if (c === "\\" && i + 1 < s.length) {
        out += s[++i];
      } else if (c === inStr) {
        inStr = null;
      }
      continue;
    }
    if (c === '"' || c === "'") {
      inStr = c;
      out += c;
      continue;
    }
    if (c === "/" && n === "/") {
      while (i < s.length && s[i] !== "\n") i++;
      if (i < s.length) out += s[i];
      continue;
    }
    out += c;
  }
  return out;
}

function replaceOutsideStrings(s: string, re: RegExp, repl: string): string {
  // Walk and skip strings.
  let out = "";
  let inStr: string | null = null;
  let buf = "";
  const flush = () => {
    out += buf.replace(re, repl);
    buf = "";
  };
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      out += c;
      if (c === "\\" && i + 1 < s.length) {
        out += s[++i];
      } else if (c === inStr) {
        inStr = null;
      }
      continue;
    }
    if (c === '"' || c === "'") {
      flush();
      inStr = c;
      out += c;
      continue;
    }
    buf += c;
  }
  flush();
  return out;
}

function convertSingleQuotes(s: string): string {
  let out = "";
  let inDouble = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inDouble) {
      out += c;
      if (c === "\\" && i + 1 < s.length) {
        out += s[++i];
      } else if (c === '"') inDouble = false;
      continue;
    }
    if (c === '"') {
      inDouble = true;
      out += c;
      continue;
    }
    if (c === "'") {
      // read single-quoted string and convert
      let str = "";
      i++;
      while (i < s.length && s[i] !== "'") {
        if (s[i] === "\\" && i + 1 < s.length) {
          str += s[i] + s[i + 1];
          i += 2;
        } else {
          if (s[i] === '"') str += '\\"';
          else str += s[i];
          i++;
        }
      }
      out += '"' + str + '"';
      continue;
    }
    out += c;
  }
  return out;
}

function quoteUnquotedKeys(s: string): string {
  // Match { or , followed by optional whitespace, an identifier, optional ws, then :
  return s.replace(
    /([{,]\s*)([A-Za-z_$][A-Za-z0-9_$\-]*)(\s*:)/g,
    '$1"$2"$3',
  );
}

export function parseLenient(input: string): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Input is empty" };

  // 1. Strict
  try {
    return { ok: true, value: JSON.parse(trimmed), lenient: false };
  } catch (e) {
    // 2. Lenient
    try {
      const cleaned = preClean(trimmed);
      const value = JSON.parse(cleaned);
      return { ok: true, value, lenient: true };
    } catch (e2) {
      const msg = (e as Error).message;
      const pos = extractPosition(msg);
      const lc = pos !== null ? getLineCol(trimmed, pos) : undefined;
      return {
        ok: false,
        error: msg,
        line: lc?.line,
        column: lc?.column,
      };
    }
  }
}
