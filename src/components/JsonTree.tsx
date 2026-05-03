import { useState, useMemo } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PathSegment } from "@/lib/sqlBuilder";
import { pathToDotString } from "@/lib/sqlBuilder";

type Props = {
  data: unknown;
  onSelect: (path: PathSegment[]) => void;
  selectedKeys?: Set<string>;
  filter?: string;
  expandAllSignal?: number;
  collapseAllSignal?: number;
};

function typeOf(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

function valuePreview(v: unknown): { text: string; cls: string } {
  if (v === null) return { text: "null", cls: "text-muted-foreground" };
  switch (typeof v) {
    case "string":
      return { text: `"${v}"`, cls: "text-emerald-600" };
    case "number":
      return { text: String(v), cls: "text-blue-600" };
    case "boolean":
      return { text: String(v), cls: "text-purple-600" };
    default:
      return { text: String(v), cls: "" };
  }
}

export function JsonTree(props: Props) {
  return (
    <div className="font-mono text-sm leading-6">
      <Node
        name="root"
        value={props.data}
        path={[]}
        depth={0}
        {...props}
      />
    </div>
  );
}

type NodeProps = Props & {
  name: string;
  value: unknown;
  path: PathSegment[];
  depth: number;
  isArrayIndex?: boolean;
};

function Node({
  name,
  value,
  path,
  depth,
  onSelect,
  selectedKeys,
  filter,
  expandAllSignal,
  collapseAllSignal,
  isArrayIndex,
  data,
}: NodeProps) {
  const [open, setOpen] = useState(depth < 2);

  // React to expand/collapse signals
  useMemo(() => {
    if (expandAllSignal !== undefined) setOpen(true);
  }, [expandAllSignal]);
  useMemo(() => {
    if (collapseAllSignal !== undefined && depth > 0) setOpen(false);
  }, [collapseAllSignal]);

  const t = typeOf(value);
  const isObj = t === "object";
  const isArr = t === "array";
  const isContainer = isObj || isArr;

  const pathKey = pathToDotString(path);
  const isSelected = selectedKeys?.has(pathKey);

  const matchesFilter =
    !filter ||
    name.toLowerCase().includes(filter.toLowerCase()) ||
    (isContainer &&
      JSON.stringify(value).toLowerCase().includes(filter.toLowerCase()));

  if (!matchesFilter) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (path.length === 0) return; // don't select root
    onSelect(path);
  };

  const labelEl = (
    <span
      onClick={handleClick}
      className={cn(
        "cursor-pointer rounded px-1 transition-colors hover:bg-accent",
        isSelected && "bg-primary/10 text-primary font-semibold",
      )}
    >
      {isArrayIndex ? (
        <span className="text-muted-foreground">[{name}]</span>
      ) : (
        <span>{name}</span>
      )}
    </span>
  );

  if (!isContainer) {
    const pv = valuePreview(value);
    return (
      <div className="flex items-start gap-1 pl-5">
        <span className="text-muted-foreground select-none">•</span>
        {labelEl}
        <span className="text-muted-foreground">:</span>
        <span className={cn("truncate", pv.cls)}>{pv.text}</span>
      </div>
    );
  }

  const entries = isArr
    ? (value as unknown[]).map((v, i) => ({
        name: String(i),
        value: v,
        seg: { kind: "index" as const, index: i },
        isArrayIndex: true,
      }))
    : Object.entries(value as Record<string, unknown>).map(([k, v]) => ({
        name: k,
        value: v,
        seg: { kind: "key" as const, name: k },
        isArrayIndex: false,
      }));

  const summary = isArr
    ? `[${(value as unknown[]).length}]`
    : `{${Object.keys(value as object).length}}`;

  return (
    <div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-muted-foreground hover:text-foreground"
          aria-label={open ? "Collapse" : "Expand"}
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
        {labelEl}
        <span className="text-muted-foreground text-xs">{summary}</span>
      </div>
      {open && (
        <div className="ml-3 border-l border-border pl-2">
          {entries.map((e) => (
            <Node
              key={e.name}
              data={data}
              name={e.name}
              value={e.value}
              path={[...path, e.seg]}
              depth={depth + 1}
              onSelect={onSelect}
              selectedKeys={selectedKeys}
              filter={filter}
              expandAllSignal={expandAllSignal}
              collapseAllSignal={collapseAllSignal}
              isArrayIndex={e.isArrayIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
}
