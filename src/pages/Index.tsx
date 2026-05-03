import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Copy, Check, Trash2, Wand2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { JsonTree } from "@/components/JsonTree";
import { RobotEyeLogo } from "@/components/RobotEyeLogo";
import { LineNumberedTextarea } from "@/components/LineNumberedTextarea";
import { parseLenient } from "@/lib/lenientJson";
import {
  buildSelect,
  flattenForSelect,
  pathToDotString,
  pathToSqlExpression,
  type PathSegment,
} from "@/lib/sqlBuilder";

type Mode = "path" | "select";

const SAMPLE = `{
  "user": {
    "id": 42,
    "name": "Ada Lovelace",
    "address": { "city": "London", "zip": "EC1A" },
    "tags": ["admin", "early-adopter"]
  },
  "events": [
    { "type": "login", "ts": 1714742400 },
    { "type": "purchase", "ts": 1714828800, "amount": 19.99 }
  ],
  "active": true
}`;

const LS_INPUT = "alljson:input";
const LS_TABLE = "alljson:table";
const LS_MODE = "alljson:mode";

const Index = () => {
  const [input, setInput] = useState<string>(() => localStorage.getItem(LS_INPUT) ?? SAMPLE);
  const [table, setTable] = useState<string>(() => localStorage.getItem(LS_TABLE) ?? "my_table");
  const [mode, setMode] = useState<Mode>(
    () => (localStorage.getItem(LS_MODE) as Mode) ?? "path",
  );
  const [parsed, setParsed] = useState<{ value: unknown; lenient: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorLoc, setErrorLoc] = useState<{ line?: number; column?: number } | null>(null);
  const [currentPath, setCurrentPath] = useState<PathSegment[] | null>(null);
  const [selected, setSelected] = useState<PathSegment[][]>([]);
  const [filter, setFilter] = useState("");
  const [flatSql, setFlatSql] = useState<string>("");
  const [copied, setCopied] = useState<string | null>(null);
  const [expandSignal, setExpandSignal] = useState(0);
  const [collapseSignal, setCollapseSignal] = useState(0);

  // Persist
  useEffect(() => {
    localStorage.setItem(LS_INPUT, input);
  }, [input]);
  useEffect(() => {
    localStorage.setItem(LS_TABLE, table);
  }, [table]);
  useEffect(() => {
    localStorage.setItem(LS_MODE, mode);
  }, [mode]);

  // Auto-parse with debounce
  useEffect(() => {
    const t = setTimeout(() => {
      if (!input.trim()) {
        setParsed(null);
        setError(null);
        return;
      }
      const r = parseLenient(input);
      if (r.ok === true) {
        setParsed({ value: r.value, lenient: r.lenient });
        setError(null);
      } else {
        setParsed(null);
        const err = r as { ok: false; error: string; line?: number; column?: number };
        const loc = err.line ? ` (line ${err.line}, col ${err.column})` : "";
        setError(err.error + loc);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [input]);

  const selectedKeys = useMemo(() => {
    return new Set(selected.map(pathToDotString));
  }, [selected]);

  const handleSelect = (path: PathSegment[]) => {
    if (mode === "path") {
      setCurrentPath(path);
    } else {
      const key = pathToDotString(path);
      setSelected((cur) => {
        const exists = cur.some((p) => pathToDotString(p) === key);
        if (exists) return cur.filter((p) => pathToDotString(p) !== key);
        return [...cur, path];
      });
    }
  };

  const copy = async (text: string, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
      toast.success(`${label} to clipboard`);
    } catch {
      toast.error("Copy failed");
    }
  };

  const formatJson = () => {
    const r = parseLenient(input);
    if (!r.ok) {
      toast.error("Cannot format — invalid JSON");
      return;
    }
    setInput(JSON.stringify(r.value, null, 2));
    toast.success(r.lenient ? "Formatted (auto-fixed)" : "Formatted");
  };

  const validate = () => {
    const r = parseLenient(input);
    if (r.ok) {
      toast.success(r.lenient ? "Valid (after auto-fix)" : "Valid JSON");
    } else {
      toast.error("Invalid JSON");
    }
  };

  const convertAll = () => {
    if (!parsed) {
      toast.error("Parse JSON first");
      return;
    }
    const paths = flattenForSelect(parsed.value);
    setFlatSql(buildSelect(paths, table || "my_table"));
  };

  const selectSql = useMemo(
    () => buildSelect(selected, table || "my_table"),
    [selected, table],
  );

  const currentPathStr = currentPath
    ? pathToSqlExpression(currentPath)
    : "";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <RobotEyeLogo />
            <p className="hidden text-xs text-muted-foreground sm:block">
              Validate JSON · explore the tree · build SQL
            </p>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a
              href="/about"
              className="text-muted-foreground hover:text-foreground"
            >
              About
            </a>
            <a
              href="https://www.linkedin.com/in/protmaks/"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              LinkedIn
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-2">
        {/* INPUT */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-muted-foreground">JSON input</h2>
              {error ? (
                <Badge variant="outline" className="border-destructive/40 text-destructive">
                  Invalid
                </Badge>
              ) : parsed ? (
                <>
                  <Badge
                    className="border-transparent text-white hover:opacity-90"
                    style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--brand-start)), hsl(var(--brand-end)))" }}
                  >
                    <Check className="mr-1 h-3 w-3" /> Valid
                  </Badge>
                  {parsed.lenient && (
                    <Badge variant="outline" className="border-amber-300 text-amber-700">
                      Auto-fixed
                    </Badge>
                  )}
                </>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setInput(SAMPLE)}>
                Sample
              </Button>
              <Button size="sm" variant="outline" onClick={validate}>
                Validate
              </Button>
              <Button size="sm" variant="outline" onClick={formatJson}>
                <Wand2 className="mr-1 h-3.5 w-3.5" /> Format
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setInput("");
                  setSelected([]);
                  setCurrentPath(null);
                  setFlatSql("");
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              <span className="font-medium">Invalid:</span> {error}
            </div>
          )}

          <LineNumberedTextarea
            value={input}
            onChange={setInput}
            placeholder="Paste JSON or JSON-like text here…"
            className="h-[calc(100vh-220px)] min-h-[420px]"
            topRight={
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 px-2 shadow-sm"
                onClick={async () => {
                  if (!input) return;
                  try {
                    await navigator.clipboard.writeText(input);
                    toast.success("Copied to clipboard");
                  } catch {
                    toast.error("Copy failed");
                  }
                }}
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
            }
          />
        </section>

        {/* TREE + SQL */}
        <section className="flex flex-col space-y-3 lg:h-[calc(100vh-140px)] lg:min-h-[520px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">Tree & SQL</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Table:</span>
              <Input
                value={table}
                onChange={(e) => setTable(e.target.value)}
                className="h-8 w-36 font-mono text-sm"
              />
              <ToggleGroup
                type="single"
                value={mode}
                onValueChange={(v) => v && setMode(v as Mode)}
                size="sm"
              >
                <ToggleGroupItem value="path" className="text-xs">
                  Path
                </ToggleGroupItem>
                <ToggleGroupItem value="select" className="text-xs">
                  Select
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* Path bar / Selection bar */}
          {mode === "path" ? (
            <Card className="flex items-center gap-2 p-3">
              <span className="text-xs text-muted-foreground">Path:</span>
              <code className="flex-1 truncate font-mono text-sm">
                {currentPathStr || (
                  <span className="text-muted-foreground">Click a field…</span>
                )}
              </code>
              <Button
                size="sm"
                variant="ghost"
                disabled={!currentPathStr}
                onClick={() => copy(currentPathStr, "Path copied")}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </Card>
          ) : (
            <Card className="flex items-center justify-between gap-2 p-3">
              <span className="text-xs text-muted-foreground">
                {selected.length} field{selected.length === 1 ? "" : "s"} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={selected.length === 0}
                  onClick={() => setSelected([])}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={selected.length === 0}
                  onClick={() => copy(selectSql, "SQL copied")}
                >
                  <Copy className="mr-1 h-3.5 w-3.5" /> Copy SQL
                </Button>
              </div>
            </Card>
          )}

          {/* Tree */}
          <Card className="flex min-h-0 flex-1 flex-col p-3">
            <div className="mb-2 flex items-center gap-2">
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter keys…"
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpandSignal((n) => n + 1)}
              >
                Expand
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCollapseSignal((n) => n + 1)}
              >
                Collapse
              </Button>
            </div>
            <div className="min-h-[200px] flex-1 overflow-auto rounded-md border border-border bg-muted/30 p-3">
              {parsed ? (
                <JsonTree
                  data={parsed.value}
                  onSelect={handleSelect}
                  selectedKeys={selectedKeys}
                  filter={filter}
                  expandAllSignal={expandSignal}
                  collapseAllSignal={collapseSignal}
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  Tree will appear once JSON is valid.
                </div>
              )}
            </div>
          </Card>

          {/* SQL output */}
          <Card className="flex min-h-0 flex-1 flex-col p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">
                {mode === "select" ? "Selected fields → SQL" : "Flatten everything"}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="default" onClick={convertAll} disabled={!parsed}>
                  Convert all to SQL
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copy(mode === "select" ? selectSql : flatSql, "SQL copied")
                  }
                  disabled={mode === "select" ? selected.length === 0 : !flatSql}
                >
                  {copied === "SQL copied" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
            <pre className="min-h-[160px] flex-1 overflow-auto whitespace-pre rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
              {mode === "select"
                ? selected.length
                  ? selectSql
                  : "-- Click fields in the tree to add them to SELECT"
                : flatSql || '-- Click "Convert all to SQL" to flatten the JSON'}
            </pre>
            <p className="mt-2 text-xs text-muted-foreground">
              Dialect: BigQuery / Snowflake (dot-notation, <code>[OFFSET(i)]</code> for arrays).
            </p>
          </Card>
        </section>
      </main>

    </div>
  );
};

export default Index;
