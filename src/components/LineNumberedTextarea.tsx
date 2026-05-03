import { ReactNode, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  topRight?: ReactNode;
  errorLine?: number | null;
  errorColumn?: number | null;
}

const LINE_HEIGHT = 24; // px, matches 1.5rem
const PAD_Y = 8; // py-2

export function LineNumberedTextarea({
  value,
  onChange,
  placeholder,
  className,
  topRight,
  errorLine,
  errorColumn,
}: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const lineCount = useMemo(() => Math.max(1, value.split("\n").length), [value]);

  useEffect(() => {
    const ta = taRef.current;
    const gutter = gutterRef.current;
    const overlay = overlayRef.current;
    if (!ta) return;
    const onScroll = () => {
      if (gutter) gutter.scrollTop = ta.scrollTop;
      if (overlay) {
        overlay.scrollTop = ta.scrollTop;
        overlay.scrollLeft = ta.scrollLeft;
      }
    };
    ta.addEventListener("scroll", onScroll);
    return () => ta.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-scroll to error line
  useEffect(() => {
    if (!errorLine || !taRef.current) return;
    const ta = taRef.current;
    const target = (errorLine - 1) * LINE_HEIGHT;
    if (target < ta.scrollTop || target > ta.scrollTop + ta.clientHeight - LINE_HEIGHT * 2) {
      ta.scrollTop = Math.max(0, target - ta.clientHeight / 2);
    }
  }, [errorLine]);

  const numbers = useMemo(
    () => Array.from({ length: lineCount }, (_, i) => i + 1).join("\n"),
    [lineCount]
  );

  return (
    <div
      className={cn(
        "relative flex overflow-hidden rounded-md border border-input bg-background font-mono text-sm",
        errorLine ? "border-destructive/50" : "",
        className
      )}
    >
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="select-none overflow-hidden whitespace-pre py-2 pl-3 pr-2 text-right text-muted-foreground/70 bg-muted/40 border-r border-border"
        style={{ lineHeight: `${LINE_HEIGHT}px`, minWidth: `${String(lineCount).length + 1}ch` }}
      >
        {Array.from({ length: lineCount }, (_, i) => {
          const n = i + 1;
          const isErr = errorLine === n;
          return (
            <div
              key={n}
              className={isErr ? "bg-destructive text-destructive-foreground rounded px-1 -mx-1" : ""}
              style={{ height: `${LINE_HEIGHT}px` }}
            >
              {n}
            </div>
          );
        })}
      </div>

      <div className="relative flex-1">
        {/* Error line highlight overlay (behind textarea) */}
        {errorLine && (
          <div
            ref={overlayRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div
              className="absolute left-0 right-0 bg-destructive/15 border-y border-destructive/40"
              style={{
                top: `${PAD_Y + (errorLine - 1) * LINE_HEIGHT}px`,
                height: `${LINE_HEIGHT}px`,
              }}
            />
          </div>
        )}
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          placeholder={placeholder}
          className="relative h-full w-full resize-none bg-transparent px-3 py-2 outline-none"
          style={{ lineHeight: `${LINE_HEIGHT}px` }}
        />
      </div>

      {topRight && <div className="absolute right-2 top-2 z-10">{topRight}</div>}
    </div>
  );
}
