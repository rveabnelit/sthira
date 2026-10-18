import { cn } from "@/lib/cn";
import type { CoverTone } from "@/content/catalog";

const TONES: Record<CoverTone, { from: string; to: string; ink: string; line: string }> = {
  sand: { from: "#f0e7d8", to: "#d7c3a6", ink: "#24392f", line: "rgba(36,57,47,0.28)" },
  sage: { from: "#e6e9de", to: "#b7c1a7", ink: "#24392f", line: "rgba(36,57,47,0.26)" },
  forest: { from: "#354b3f", to: "#1a2a22", ink: "#f3f0e8", line: "rgba(243,240,232,0.32)" },
  clay: { from: "#eadcd0", to: "#cbae96", ink: "#3a2e26", line: "rgba(58,46,38,0.24)" },
  ivory: { from: "#f8f5ed", to: "#e4dccb", ink: "#24392f", line: "rgba(36,57,47,0.22)" },
};

export function PracticeCover({
  tone = "sand",
  variant = 0,
  label,
  number,
  className,
  children,
}: {
  tone?: CoverTone;
  variant?: number;
  label?: string;
  number?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const palette = TONES[tone] ?? TONES.sand;
  const v = ((variant % 3) + 3) % 3;
  const uid = `${tone}-${v}-${number ?? label ?? "x"}`.replace(/[^a-zA-Zа-яА-Я0-9-]/g, "");

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        role="img"
        aria-label={label ? `Обложка: ${label}` : "Обложка практики"}
      >
        <defs>
          <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={palette.from} />
            <stop offset="1" stopColor={palette.to} />
          </linearGradient>
          <radialGradient id={`light-${uid}`}>
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.62" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="300" fill={`url(#bg-${uid})`} />
        <ellipse cx={v === 1 ? 90 : 300} cy={v === 0 ? 40 : 60} rx={210} ry={150} fill={`url(#light-${uid})`} />
        {v === 0 ? (
          <>
            <circle cx={332} cy={74} r={112} fill="none" stroke={palette.line} strokeWidth={1} />
            <circle cx={332} cy={74} r={70} fill="none" stroke={palette.line} strokeWidth={0.6} opacity={0.6} />
            <line x1={0} y1={236} x2={400} y2={252} stroke={palette.line} strokeWidth={0.8} />
          </>
        ) : v === 1 ? (
          <>
            <circle cx={64} cy={232} r={148} fill="none" stroke={palette.line} strokeWidth={1} />
            <line x1={272} y1={0} x2={240} y2={300} stroke={palette.line} strokeWidth={0.8} />
            <line x1={282} y1={0} x2={250} y2={300} stroke={palette.line} strokeWidth={0.5} opacity={0.6} />
          </>
        ) : (
          <>
            <path d="M-30 210a120 120 0 0 1 240 0" fill="none" stroke={palette.line} strokeWidth={1} />
            <path d="M-30 240a150 150 0 0 1 300 0" fill="none" stroke={palette.line} strokeWidth={0.6} opacity={0.7} />
            <line x1={0} y1={120} x2={400} y2={60} stroke={palette.line} strokeWidth={0.8} />
          </>
        )}
        {number ? (
          <text
            x={358}
            y={268}
            textAnchor="end"
            fontFamily="var(--font-serif)"
            fontSize={44}
            fill={palette.ink}
            opacity={0.45}
            letterSpacing="2"
          >
            {number}
          </text>
        ) : null}
      </svg>
      {children}
    </div>
  );
}

export function toneForIndex(index: number): CoverTone {
  const tones: CoverTone[] = ["sand", "sage", "ivory", "clay", "forest"];
  return tones[index % tones.length] ?? "sand";
}
