import { useEffect, useRef, useState } from "react";

/**
 * AllJSON wordmark with a robotic eye replacing the "O".
 * The pupil tracks the mouse cursor across the viewport.
 */
export function RobotEyeLogo() {
  const eyeRef = useRef<HTMLSpanElement>(null);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const el = eyeRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      // Max pupil travel inside the eye (px)
      const max = Math.min(rect.width, rect.height) * 0.18;
      const limited = Math.min(dist, max);
      setPupil({
        x: (dx / dist) * limited,
        y: (dy / dist) * limited,
      });
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  return (
    <h1 className="flex items-center gap-0.5 text-3xl font-extrabold tracking-tight leading-none">
      <span className="bg-gradient-to-br from-primary via-primary to-accent bg-clip-text text-transparent">
        All
      </span>
      <span className="bg-gradient-to-br from-primary via-primary to-accent bg-clip-text text-transparent">
        J
      </span>
      <span className="bg-gradient-to-br from-primary via-primary to-accent bg-clip-text text-transparent">
        S
      </span>
      {/* Robotic eye replacing the "O" */}
      <span
        ref={eyeRef}
        aria-label="O"
        className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-[0_0_12px_hsl(var(--primary)/0.5)] ring-2 ring-primary/40"
      >
        <span className="absolute inset-[3px] rounded-full bg-background" />
        <span
          className="relative h-3 w-3 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary))] transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${pupil.x}px, ${pupil.y}px)`,
          }}
        >
          <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
        </span>
      </span>
      <span className="bg-gradient-to-br from-primary via-primary to-accent bg-clip-text text-transparent">
        N
      </span>
    </h1>
  );
}
