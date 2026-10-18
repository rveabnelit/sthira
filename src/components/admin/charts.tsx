import { cn } from "@/lib/cn";

export function AreaChart({
  data,
  height = 120,
  className,
  tone = "forest",
  formatValue,
}: {
  data: { day: string; value: number }[];
  height?: number;
  className?: string;
  tone?: "forest" | "sage";
  formatValue?: (value: number) => string;
}) {
  const width = 560;
  const max = Math.max(1, ...data.map((item) => item.value));
  const step = data.length > 1 ? width / (data.length - 1) : width;
  const points = data.map((item, index) => {
    const x = index * step;
    const y = height - (item.value / max) * (height - 16) - 8;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `0,${height} ${points.join(" ")} ${width},${height}`;
  const color = tone === "forest" ? "#24392f" : "#a4ad96";
  const last = data[data.length - 1];

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="График">
        <defs>
          <linearGradient id={`area-${tone}-${data.length}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.18" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#area-${tone}-${data.length})`} />
        <polyline points={points.join(" ")} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted">
        <span>{data[0]?.day.slice(5)}</span>
        <span className="text-[11px] font-medium text-ink">
          {formatValue ? formatValue(last?.value ?? 0) : last?.value ?? 0}
        </span>
        <span>{last?.day.slice(5)}</span>
      </div>
    </div>
  );
}

export function MiniBars({ data, className }: { data: { label: string; value: number }[]; className?: string }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <div className={cn("space-y-2.5", className)}>
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-[11.5px] text-[#4d5048]">{item.label}</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eae6dc]">
            <span className="block h-full rounded-full bg-forest/70" style={{ width: `${(item.value / max) * 100}%` }} />
          </span>
          <span className="w-8 shrink-0 text-right text-[11px] text-muted">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export function DonutStat({
  value,
  max,
  label,
  sublabel,
}: {
  value: number;
  max: number;
  label: string;
  sublabel?: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="flex items-center gap-4">
      <svg width="84" height="84" viewBox="0 0 84 84" role="img" aria-label={label}>
        <circle cx="42" cy="42" r={radius} fill="none" stroke="#eae6dc" strokeWidth="7" />
        <circle
          cx="42"
          cy="42"
          r={radius}
          fill="none"
          stroke="#24392f"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${(percent / 100) * circumference} ${circumference}`}
          transform="rotate(-90 42 42)"
        />
        <text x="42" y="46" textAnchor="middle" fontSize="15" fill="#292b27" fontFamily="var(--font-serif)">
          {percent}%
        </text>
      </svg>
      <div>
        <p className="text-[12.5px] font-medium text-ink">{label}</p>
        {sublabel ? <p className="mt-1 text-[11px] leading-relaxed text-muted">{sublabel}</p> : null}
      </div>
    </div>
  );
}
