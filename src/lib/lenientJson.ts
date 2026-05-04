// Lenient JSON parser: handles trailing commas, single quotes, unquoted keys,
// JS comments, `undefined`/`NaN`/`Infinity`, and Python repr (None/True/False,
// enum objects like <Foo.BAR: 'val'>, dataclass reprs like Foo(key=val)).

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

// Python enum repr: <ClassName.VALUE: 'str'> or <ClassName.VALUE: 42> → value
function convertPythonEnums(s: string): string {
  return s.replace(
    /<[A-Za-z_][A-Za-z0-9_.]*:\s*('[^']*'|"[^"]*"|-?[\d.]+(?:[eE][+-]?\d+)?|[A-Za-z_][A-Za-z0-9_]*)\s*>/g,
    (_, val) => val.trim(),
  );
}

// Inside a Python object repr, convert keyword args: key=val → key:val
function convertKeywordArgs(s: string): string {
  let result = "";
  let i = 0;
  while (i < s.length) {
    if (s[i] === '"' || s[i] === "'") {
      const q = s[i];
      result += s[i++];
      while (i < s.length && s[i] !== q) {
        if (s[i] === "\\") result += s[i++];
        if (i < s.length) result += s[i++];
      }
      if (i < s.length) result += s[i++];
      continue;
    }
    const m = s.slice(i).match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (m) {
      result += m[1] + ":";
      i += m[0].length;
      continue;
    }
    result += s[i++];
  }
  return result;
}

// Python object repr: ClassName(key=val, ...) → {key: val, ...}, inside-out
function convertPythonObjectReprs(s: string): string {
  let prev = "";
  while (prev !== s) {
    prev = s;
    let result = "";
    let i = 0;
    while (i < s.length) {
      // Skip strings
      if (s[i] === '"' || s[i] === "'") {
        const q = s[i];
        result += s[i++];
        while (i < s.length && s[i] !== q) {
          if (s[i] === "\\" && i + 1 < s.length) result += s[i++];
          result += s[i++];
        }
        if (i < s.length) result += s[i++];
        continue;
      }
      // Match ClassName( and find balanced closing )
      const m = s.slice(i).match(/^([A-Za-z_][A-Za-z0-9_]*)\(/);
      if (m) {
        const nameEnd = i + m[1].length + 1; // position after (
        let depth = 1;
        let j = nameEnd;
        let inStr: string | null = null;
        while (j < s.length && depth > 0) {
          const c = s[j];
          if (inStr) {
            if (c === "\\" && j + 1 < s.length) j++;
            else if (c === inStr) inStr = null;
          } else if (c === '"' || c === "'") {
            inStr = c;
          } else if (c === "(") {
            depth++;
          } else if (c === ")") {
            if (--depth === 0) break;
          }
          j++;
        }
        if (depth === 0) {
          const inner = s.slice(nameEnd, j);
          result += "{" + convertKeywordArgs(inner) + "}";
          i = j + 1;
          continue;
        }
      }
      result += s[i++];
    }
    s = result;
  }
  return s;
}

function preClean(input: string): string {
  let s = input;
  // Strip block comments
  s = s.replace(/\/\*[\s\S]*?\*\//g, "");
  // Strip line comments (avoid hitting inside strings: simple heuristic walks chars)
  s = stripLineComments(s);
  // Python repr: convert enums and object reprs before other transforms
  s = convertPythonEnums(s);
  s = convertPythonObjectReprs(s);
  // Replace bare undefined / NaN / Infinity / Python None with null (outside strings)
  s = replaceOutsideStrings(s, /\b(undefined|NaN|Infinity|-Infinity|None)\b/g, "null");
  // Replace Python True/False with JSON true/false (outside strings)
  s = replaceOutsideStrings(s, /\bTrue\b/g, "true");
  s = replaceOutsideStrings(s, /\bFalse\b/g, "false");
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
