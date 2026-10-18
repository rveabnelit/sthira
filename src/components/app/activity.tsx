import { cn } from "@/lib/cn";

export function ActivityCalendar({ days }: { days: { date: string; count: number }[] }) {
  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  function level(count: number) {
    if (count === 0) return "bg-[#ece8dd]";
    if (count === 1) return "bg-[#b9c4ac]";
    if (count === 2) return "bg-[#7d9170]";
    return "bg-[#3f5a43]";
  }

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, index) => (
          <div key={index} className="flex flex-col gap-1">
            {week.map((day) => (
              <span
                key={day.date}
                title={`${new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(new Date(day.date + "T00:00:00Z"))}: ${day.count}`}
                className={cn("h-4 w-4 rounded-[3px]", level(day.count))}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10.5px] text-muted">
        <span>меньше</span>
        {[0, 1, 2, 3].map((value) => (
          <span key={value} className={cn("h-3 w-3 rounded-[2px]", level(value))} />
        ))}
        <span>больше</span>
        <span className="ml-auto">12 недель</span>
      </div>
    </div>
  );
}

export function WeeklyBars({ weeks }: { weeks: { label: string; count: number }[] }) {
  const max = Math.max(1, ...weeks.map((week) => week.count));
  return (
    <div className="flex h-36 items-end gap-2">
      {weeks.map((week) => (
        <div key={week.label} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-[10px] text-muted">{week.count > 0 ? week.count : ""}</span>
          <div
            className={cn("w-full rounded-t-sm", week.count > 0 ? "bg-forest/75" : "bg-[#e7e3d8]")}
            style={{ height: `${6 + (week.count / max) * 84}px` }}
            title={`${week.label}: ${week.count}`}
          />
          <span className="text-[9.5px] text-muted">{week.label}</span>
        </div>
      ))}
    </div>
  );
}
