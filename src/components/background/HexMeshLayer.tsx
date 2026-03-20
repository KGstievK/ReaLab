"use client";

import { useEffect, useRef } from "react";
import scss from "./HexMeshLayer.module.scss";

type Variant = "hero" | "ambient" | "panel";
type Density = "relaxed" | "balanced" | "dense";

type Ripple = {
  x: number;
  y: number;
  startedAt: number;
  strength: number;
};

type TrailPoint = {
  x: number;
  y: number;
  startedAt: number;
  velocity: number;
};

type Cell = {
  x: number;
  y: number;
  seed: number;
  baseRelief: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const TAU = Math.PI * 2;

const VARIANT_SETTINGS: Record<
  Variant,
  {
    idleAmplitude: number;
    pointerAmplitude: number;
    fillBase: number;
    highlightBase: number;
    shadowBase: number;
    accentBase: number;
  }
> = {
  hero: {
    idleAmplitude: 0.22,
    pointerAmplitude: 1.42,
    fillBase: 0.112,
    highlightBase: 0.17,
    shadowBase: 0.112,
    accentBase: 0.03,
  },
  ambient: {
    idleAmplitude: 0.15,
    pointerAmplitude: 0.96,
    fillBase: 0.096,
    highlightBase: 0.145,
    shadowBase: 0.094,
    accentBase: 0.02,
  },
  panel: {
    idleAmplitude: 0.11,
    pointerAmplitude: 0.72,
    fillBase: 0.09,
    highlightBase: 0.132,
    shadowBase: 0.086,
    accentBase: 0.016,
  },
};

const CELL_RADIUS: Record<Variant, Record<Density, number>> = {
  hero: {
    relaxed: 58,
    balanced: 52,
    dense: 46,
  },
  ambient: {
    relaxed: 64,
    balanced: 58,
    dense: 50,
  },
  panel: {
    relaxed: 54,
    balanced: 48,
    dense: 42,
  },
};

const buildHexPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
) => {
  ctx.beginPath();
  for (let index = 0; index < 6; index += 1) {
    const angle = (Math.PI / 180) * (60 * index - 30);
    const px = x + radius * Math.cos(angle);
    const py = y + radius * Math.sin(angle);
    if (index === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
};

const getCellRadius = (variant: Variant, density: Density, simplified: boolean) => {
  const baseRadius = CELL_RADIUS[variant][density];
  return simplified ? baseRadius + 4 : baseRadius;
};

const buildCells = (width: number, height: number, radius: number): Cell[] => {
  const hexWidth = radius * Math.sqrt(3);
  const verticalStep = radius * 1.5;
  const rows = Math.ceil(height / verticalStep) + 3;
  const cols = Math.ceil(width / hexWidth) + 3;
  const cells: Cell[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = col * hexWidth + (row % 2 ? hexWidth / 2 : 0) - hexWidth / 2;
      const y = row * verticalStep - radius;
      const seed = ((row * 41 + col * 17) % 97) / 97;
      const baseNoise =
        (((row * 19 + col * 13) % 11) - 5) / 42 + Math.sin((row + col) * 0.63) * 0.03;

      cells.push({
        x,
        y,
        seed,
        baseRelief: clamp(baseNoise + (seed - 0.5) * 0.1, -0.22, 0.22),
      });
    }
  }

  return cells;
};

const HexMeshLayer = ({
  className = "",
  variant = "hero",
  density = "balanced",
  interactive = true,
}: {
  className?: string;
  variant?: Variant;
  density?: Density;
  interactive?: boolean;
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const host = root?.parentElement;

    if (!root || !canvas || !host) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      root.dataset.canvas = "off";
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const hoverCapable = window.matchMedia("(hover: hover)").matches;
    const coarsePointer =
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(hover: none)").matches;
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const lowMemory = Boolean(deviceMemory && deviceMemory <= 4);
    const smallViewport = window.innerWidth < 920;
    const simplified = lowMemory || variant === "panel" || smallViewport;
    const canvasEnabled = !prefersReducedMotion && !coarsePointer;
    const allowPointer = interactive && canvasEnabled && finePointer && hoverCapable;

    root.dataset.canvas = canvasEnabled ? "on" : "off";

    if (!canvasEnabled) {
      return;
    }

    const settings = VARIANT_SETTINGS[variant];

    let width = 0;
    let height = 0;
    let dpr = 1;
    let cellRadius = getCellRadius(variant, density, simplified);
    let cells: Cell[] = [];
    let rafId = 0;
    let running = true;
    let visible = document.visibilityState === "visible";
    let inViewport = true;
    let lastRender = 0;
    let pointerX = -9999;
    let pointerY = -9999;
    let lastPointerX = -9999;
    let lastPointerY = -9999;
    let pointerActive = false;
    let pointerSpeed = 0;
    let lastPointerAt = performance.now();
    let ripples: Ripple[] = [];
    let trail: TrailPoint[] = [];

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });

    const syncLoop = () => {
      const shouldRun = running && visible && inViewport;

      if (shouldRun && !rafId) {
        rafId = window.requestAnimationFrame(draw);
      }

      if (!shouldRun && rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const resize = () => {
      width = Math.max(host.clientWidth, 1);
      height = Math.max(host.clientHeight, 1);
      dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      cellRadius = getCellRadius(variant, density, simplified);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cells = buildCells(width, height, cellRadius);
      lastRender = 0;
      syncLoop();
    };

    const draw = (timestamp: number) => {
      rafId = 0;

      if (!running || !visible || !inViewport) {
        return;
      }

      const hasDynamicSignal = allowPointer && (pointerActive || trail.length > 0 || ripples.length > 0);
      const fpsCap = hasDynamicSignal ? 60 : 24;

      if (lastRender && timestamp - lastRender < 1000 / fpsCap) {
        syncLoop();
        return;
      }

      lastRender = timestamp;

      const time = timestamp / 1000;
      const influenceRadius = simplified ? 132 : 168;
      const rippleSpeed = simplified ? 390 : 460;
      const waveWidth = simplified ? 74 : 90;

      ctx.clearRect(0, 0, width, height);

      trail = trail.filter((point) => timestamp - point.startedAt < 520);
      ripples = ripples.filter((ripple) => timestamp - ripple.startedAt < 920);

      if (pointerActive && timestamp - lastPointerAt > 460) {
        pointerActive = false;
      }

      for (const cell of cells) {
        let relief =
          cell.baseRelief +
          Math.sin(
            time * 0.28 + cell.seed * TAU + cell.x * 0.0028 + cell.y * 0.0017,
          ) *
            settings.idleAmplitude;
        let interactionLevel = 0;

        if (allowPointer && trail.length > 0) {
          for (const point of trail) {
            const age = timestamp - point.startedAt;
            const decay = Math.max(0, 1 - age / 520);
            const dx = cell.x - point.x;
            const dy = cell.y - point.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const normalized = distance / influenceRadius;

            if (normalized > 1.24) {
              continue;
            }

            const core = Math.exp(-normalized * normalized * 2.95);
            const shoulder = Math.exp(-((normalized - 0.56) ** 2) / 0.046);
            const dent = -core * (0.78 + point.velocity * 0.34) + shoulder * 0.28;
            const localized = dent * decay * settings.pointerAmplitude;

            relief += localized;
            interactionLevel += Math.max(core, shoulder * 0.75) * decay;
          }
        }

        for (const ripple of ripples) {
          const age = timestamp - ripple.startedAt;
          const progress = (age / 1000) * rippleSpeed;
          const distance = Math.sqrt((cell.x - ripple.x) ** 2 + (cell.y - ripple.y) ** 2);
          const delta = distance - progress;

          if (Math.abs(delta) > waveWidth) {
            continue;
          }

          const envelope =
            Math.max(0, 1 - Math.abs(delta) / waveWidth) * Math.max(0, 1 - age / 920);
          const oscillation = Math.cos((delta / waveWidth) * Math.PI);
          relief += oscillation * envelope * 0.48 * ripple.strength;
          interactionLevel += envelope * 0.58;
        }

        const normalizedInteraction = clamp(interactionLevel, 0, 1);
        const clampedRelief = clamp(relief, -1, 1);
        const magnitude = Math.abs(clampedRelief);
        const raised = clampedRelief >= 0;
        const offset = 0.95 + magnitude * 1.45;
        const highlightAlpha =
          settings.highlightBase +
          (raised ? magnitude : magnitude * 0.55) * 0.26 +
          normalizedInteraction * 0.07;
        const shadowAlpha =
          settings.shadowBase +
          (!raised ? magnitude : magnitude * 0.65) * 0.24 +
          normalizedInteraction * 0.06;
        const fillAlpha = settings.fillBase + magnitude * 0.058 + normalizedInteraction * 0.028;
        const accentAlpha = settings.accentBase + normalizedInteraction * 0.075 + magnitude * 0.018;

        buildHexPath(ctx, cell.x, cell.y, cellRadius);
        ctx.fillStyle = `rgba(250, 252, 253, ${fillAlpha})`;
        ctx.fill();

        if (accentAlpha > 0.002) {
          buildHexPath(ctx, cell.x, cell.y, cellRadius);
          ctx.fillStyle = `rgba(141, 184, 199, ${accentAlpha})`;
          ctx.fill();
        }

        ctx.save();
        ctx.translate(raised ? -offset : offset, raised ? -offset : offset);
        buildHexPath(ctx, cell.x, cell.y, cellRadius);
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(255, 255, 255, ${highlightAlpha})`;
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(raised ? offset : -offset, raised ? offset : -offset);
        buildHexPath(ctx, cell.x, cell.y, cellRadius);
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(186, 197, 210, ${shadowAlpha})`;
        ctx.stroke();
        ctx.restore();
      }

      syncLoop();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!allowPointer) {
        return;
      }

      const bounds = host.getBoundingClientRect();
      pointerX = event.clientX - bounds.left;
      pointerY = event.clientY - bounds.top;

      const now = performance.now();
      const deltaT = Math.max(16, now - lastPointerAt);
      const deltaX = lastPointerX === -9999 ? 0 : pointerX - lastPointerX;
      const deltaY = lastPointerY === -9999 ? 0 : pointerY - lastPointerY;

      pointerSpeed = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / (deltaT / 1000);
      lastPointerAt = now;
      lastPointerX = pointerX;
      lastPointerY = pointerY;
      pointerActive = true;

      trail = [
        {
          x: pointerX,
          y: pointerY,
          startedAt: now,
          velocity: clamp(pointerSpeed / 860, 0.55, 1.35),
        },
        ...trail,
      ].slice(0, 7);

      syncLoop();
    };

    const handlePointerLeave = () => {
      pointerActive = false;
      pointerSpeed = 0;
    };

    const handleClick = (event: MouseEvent) => {
      if (!allowPointer) {
        return;
      }

      const bounds = host.getBoundingClientRect();

      ripples = [
        ...ripples,
        {
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
          startedAt: performance.now(),
          strength: clamp(0.82 + pointerSpeed / 1400, 0.82, 1.35),
        },
      ].slice(-5);

      syncLoop();
    };

    const handleVisibilityChange = () => {
      visible = document.visibilityState === "visible";
      lastRender = 0;
      syncLoop();
    };

    let intersectionObserver: IntersectionObserver | null = null;

    if ("IntersectionObserver" in window) {
      intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          inViewport = entry.isIntersecting || entry.intersectionRatio > 0;
          lastRender = 0;
          syncLoop();
        },
        {
          threshold: 0.02,
        },
      );
      intersectionObserver.observe(host);
    }

    resizeObserver.observe(host);
    resize();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (allowPointer) {
      host.addEventListener("pointermove", handlePointerMove);
      host.addEventListener("pointerleave", handlePointerLeave);
      host.addEventListener("click", handleClick);
    }

    syncLoop();

    return () => {
      running = false;
      resizeObserver.disconnect();
      intersectionObserver?.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (allowPointer) {
        host.removeEventListener("pointermove", handlePointerMove);
        host.removeEventListener("pointerleave", handlePointerLeave);
        host.removeEventListener("click", handleClick);
      }

      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [density, interactive, variant]);

  return (
    <div
      ref={rootRef}
      className={`${scss.layer} ${className}`.trim()}
      data-canvas="off"
      data-density={density}
      data-variant={variant}
      aria-hidden="true"
    >
      <div className={scss.staticRelief} />
      <canvas ref={canvasRef} className={scss.canvas} />
    </div>
  );
};

export default HexMeshLayer;
