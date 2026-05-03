import { ReactNode, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  topRight?: ReactNode;
}

export function LineNumberedTextarea({ value, onChange, placeholder, className, topRight }: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lineCount = useMemo(() => Math.max(1, value.split("\n").length), [value]);

  useEffect(() => {
    const ta = taRef.current;
    const gutter = gutterRef.current;
    if (!ta || !gutter) return;
    const onScroll = () => {
      gutter.scrollTop = ta.scrollTop;
    };
    ta.addEventListener("scroll", onScroll);
    return () => ta.removeEventListener("scroll", onScroll);
  }, []);

  const numbers = useMemo(
    () => Array.from({ length: lineCount }, (_, i) => i + 1).join("\n"),
    [lineCount]
  );

  return (
    <div
      className={cn(
        "relative flex overflow-hidden rounded-md border border-input bg-background font-mono text-sm",
        className
      )}
    >
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="select-none overflow-hidden whitespace-pre py-2 pl-3 pr-2 text-right text-muted-foreground/70 bg-muted/40 border-r border-border"
        style={{ lineHeight: "1.5rem", minWidth: `${String(lineCount).length + 1}ch` }}
      >
        {numbers}
      </div>
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder={placeholder}
        className="flex-1 resize-none bg-transparent px-3 py-2 outline-none"
        style={{ lineHeight: "1.5rem" }}
      />
      {topRight && (
        <div className="absolute right-2 top-2 z-10">{topRight}</div>
      )}
    </div>
  );
}
