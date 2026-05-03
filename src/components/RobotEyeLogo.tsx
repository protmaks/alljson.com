import { useEffect, useRef, useState } from "react";

/**
 * AllJSON wordmark with a robotic eye replacing the "O".
 * The pupil tracks the mouse cursor across the viewport.
 */
export function RobotEyeLogo() {
  const eyeRef = useRef<HTMLSpanElement>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
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
      const max = Math.min(rect.width, rect.height) * 0.18;
      const limited = Math.min(dist, max);
      targetRef.current = {
        x: (dx / dist) * limited,
        y: (dy / dist) * limited,
      };
    };

    const tick = () => {
      // Easing factor — smaller = slower & smoother
      const ease = 0.06;
      const c = currentRef.current;
      const t = targetRef.current;
      c.x += (t.x - c.x) * ease;
      c.y += (t.y - c.y) * ease;
      setPupil({ x: c.x, y: c.y });
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", handle);
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", handle);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);


  return (
    <h1 className="flex items-center gap-0.5 text-3xl font-extrabold tracking-tight leading-none">
      <span className="text-foreground">All</span>
      <span
        className="bg-clip-text text-transparent"
        style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--brand-start)), hsl(var(--brand-end)))" }}
      >
        J
      </span>
      <span
        className="bg-clip-text text-transparent"
        style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--brand-start)), hsl(var(--brand-end)))" }}
      >
        S
      </span>
      {/* Robotic eye replacing the "O" */}
      <span
        ref={eyeRef}
        aria-label="O"
        className="relative inline-flex h-7 w-7 items-center justify-center rounded-full"
        style={{ backgroundColor: "hsl(var(--brand-start))" }}
      >
        <span className="absolute inset-[3px] rounded-full bg-background" />
        <span
          className="relative h-1.5 w-1.5 rounded-full"
          style={{
            transform: `translate(${pupil.x}px, ${pupil.y}px)`,
            backgroundColor: "hsl(var(--brand-start))",
          }}
        />
      </span>
      <span
        className="bg-clip-text text-transparent"
        style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--brand-start)), hsl(var(--brand-end)))" }}
      >
        N
      </span>
    </h1>
  );
}
