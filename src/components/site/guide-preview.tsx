import { ArrowUp, Sparkles, FileText } from "lucide-react";

export function GuidePreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className="surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-forest text-ivory">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[12.5px] font-medium leading-none text-ink">STHIRA Guide</p>
            <p className="mt-1 text-[10.5px] leading-none text-muted">по материалам школы</p>
          </div>
        </div>
        <span className="badge badge-sand">Демо</span>
      </div>

      <div className={compact ? "space-y-3.5 p-4" : "space-y-4 p-5"}>
        <div className="ml-auto max-w-[85%] rounded-[14px] rounded-br-[4px] bg-forest px-4 py-2.5 text-[13px] leading-relaxed text-ivory">
          Я пропустила неделю. С чего лучше вернуться?
        </div>

        <div className="max-w-[92%] rounded-[14px] rounded-bl-[4px] bg-[#f2eee5] px-4 py-3 text-[13px] leading-relaxed text-[#3f423b]">
          <p>
            После перерыва не нужно возвращаться к прежнему объёму. Начните с одной короткой практики на
            10–15 минут — например, «Короткая пауза» или «Дыхание и опора».
          </p>
          <p className="mt-2 text-[12px] text-muted">
            Две практики в неделю в течение двух недель — достаточный минимум, чтобы вернуть ритм.
          </p>

          <div className="mt-3 space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-paper px-2 py-1 text-[11px] text-[#5c5f56]">
              <FileText className="h-3 w-3" />
              Как вернуться после перерыва
            </span>
            <div className="flex items-center gap-3 rounded-lg border border-line bg-paper p-2">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-sand-soft font-serif text-[13px] text-forest">
                10
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12px] font-medium text-ink">Короткая пауза</span>
                <span className="block text-[10.5px] text-muted">10 минут · начальный</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2.5">
          <span className="flex-1 text-[12.5px] text-[#a3a49b]">Спросите про практику…</span>
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-forest/90 text-ivory">
            <ArrowUp className="h-3.5 w-3.5" />
          </span>
        </div>
        <p className="text-[10.5px] leading-relaxed text-muted">
          Guide не ставит диагнозы и не заменяет консультацию специалиста.
        </p>
      </div>
    </div>
  );
}
