"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Maximize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { PracticeCover } from "@/components/covers/practice-cover";
import type { CoverTone } from "@/content/catalog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

export function PracticePlayer({
  practiceId,
  title,
  durationMinutes,
  videoUrl,
  coverTone,
  lessonId,
  initialPosition,
  teacherNote,
}: {
  practiceId: string;
  title: string;
  durationMinutes: number;
  videoUrl: string | null;
  coverTone: CoverTone;
  lessonId?: string | null;
  initialPosition: number;
  teacherNote?: string | null;
}) {
  const total = Math.max(60, durationMinutes * 60);
  const [time, setTime] = useState(Math.min(initialPosition, total));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const savedRef = useRef(initialPosition);
  const router = useRouter();
  const toast = useToast();

  const save = useCallback(
    async (position: number) => {
      savedRef.current = position;
      try {
        await fetch(`/api/v1/practices/${practiceId}/progress`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ positionSeconds: position, durationSeconds: total }),
        });
      } catch {
        /* прогресс сохранится при следующей попытке */
      }
    },
    [practiceId, total],
  );

  useEffect(() => {
    if (!playing || videoUrl) return;
    const interval = setInterval(() => {
      setTime((current) => {
        const next = Math.min(current + speed, total);
        if (next >= total) {
          setPlaying(false);
          setFinished(true);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [playing, speed, total, videoUrl]);

  useEffect(() => {
    if (Math.abs(time - savedRef.current) >= 15) {
      void save(time);
    }
  }, [time, save]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") void save(time);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      void save(time);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [save]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = muted ? 0 : volume;
      videoRef.current.playbackRate = speed;
    }
  }, [volume, muted, speed]);

  async function togglePlay() {
    setError(null);
    if (videoUrl && videoRef.current) {
      try {
        if (videoRef.current.paused) await videoRef.current.play();
        else videoRef.current.pause();
      } catch {
        setError("Не удалось запустить видео. Проверьте соединение и попробуйте снова.");
      }
      return;
    }
    if (time >= total) {
      setTime(0);
      setFinished(false);
    }
    setPlaying((value) => !value);
  }

  function seek(value: number) {
    const next = Math.max(0, Math.min(total, value));
    setTime(next);
    setFinished(next >= total - 1);
    if (videoUrl && videoRef.current) videoRef.current.currentTime = next;
  }

  async function complete() {
    setCompleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/practices/${practiceId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programLessonId: lessonId ?? null,
          durationSeconds: Math.max(1, Math.round(time)),
        }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error?.message ?? "Не удалось сохранить завершение.");
        setCompleting(false);
        return;
      }
      toast.push(json?.data?.created ? "Практика завершена. Прогресс сохранён." : "Практика уже отмечена.", "success");
      router.push(`/app/practice/${practiceId}/completed${lessonId ? `?lesson=${lessonId}` : ""}`);
    } catch {
      setError("Нет соединения. Завершение не сохранено.");
      setCompleting(false);
    }
  }

  function toggleFullscreen() {
    const element = containerRef.current;
    if (!element) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void element.requestFullscreen?.().catch(() => setError("Полноэкранный режим недоступен в этом браузере."));
  }

  const percent = (time / total) * 100;

  return (
    <div>
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-[20px] border border-line bg-[#16231c]"
        onKeyDown={(event) => {
          if (event.code === "Space") {
            event.preventDefault();
            void togglePlay();
          }
          if (event.code === "ArrowRight") seek(time + 10);
          if (event.code === "ArrowLeft") seek(time - 10);
        }}
        tabIndex={0}
        role="region"
        aria-label={`Плеер практики «${title}»`}
      >
        <div className="relative aspect-video">
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              poster={`/images/light-wall.jpg`}
              playsInline
              controls={false}
              className="h-full w-full object-cover"
              onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => {
                setPlaying(false);
                setFinished(true);
              }}
              onError={() => setError("Видео недоступно. Проверьте соединение и попробуйте повторить.")}
              aria-label={title}
            />
          ) : (
            <div className="relative h-full w-full">
              <PracticeCover tone={coverTone} variant={3} label={title} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#16231c]/80 via-[#16231c]/30 to-[#16231c]/10" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={playing ? "Пауза" : "Воспроизвести"}
                  className="grid h-16 w-16 place-items-center rounded-full bg-paper/95 text-forest shadow-xl transition-transform hover:scale-105"
                >
                  {playing ? <Pause className="h-6 w-6 fill-forest" /> : <Play className="ml-1 h-7 w-7 fill-forest" />}
                </button>
                <p className="max-w-md text-[11px] leading-relaxed text-ivory/70">
                  Демо-плеер: видеопоток не подключён. Идёт отметка времени практики — завершение и прогресс
                  сохраняются как при реальном просмотре.
                </p>
              </div>
            </div>
          )}

          {error ? (
            <div className="absolute inset-x-4 bottom-20 rounded-xl border border-[#e3c8c0] bg-[#fbf1ee] p-3 text-center">
              <p className="text-[12px] text-[#8a3d2f]">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  void togglePlay();
                }}
                className="mt-2 inline-flex h-8 items-center rounded-lg bg-[#8a3d2f] px-3 text-[11.5px] font-medium text-white"
              >
                Повторить
              </button>
            </div>
          ) : null}
        </div>

        {/* Управление */}
        <div className="border-t border-white/10 bg-[#13201a] px-3 py-3 text-ivory sm:px-4">
          <div className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-[11px] tabular-nums text-ivory/70">{formatTime(time)}</span>
            <div className="relative flex-1">
              <input
                type="range"
                min={0}
                max={total}
                step={1}
                value={Math.floor(time)}
                onChange={(event) => seek(Number(event.target.value))}
                aria-label="Перемотка"
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#a4ad96]"
                style={{
                  background: `linear-gradient(to right, #a4ad96 ${percent}%, rgba(255,255,255,0.15) ${percent}%)`,
                }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-ivory/50">{formatTime(total)}</span>
          </div>

          <div className="mt-2.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Пауза" : "Воспроизвести"}
              className="grid h-9 w-9 place-items-center rounded-lg text-ivory transition-colors hover:bg-white/10"
            >
              {playing ? <Pause className="h-4 w-4 fill-ivory" /> : <Play className="h-4 w-4 fill-ivory" />}
            </button>
            <button
              type="button"
              onClick={() => seek(time - 10)}
              aria-label="Назад на 10 секунд"
              className="grid h-9 w-9 place-items-center rounded-lg text-ivory/80 transition-colors hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => seek(time + 10)}
              aria-label="Вперёд на 10 секунд"
              className="grid h-9 w-9 place-items-center rounded-lg text-ivory/80 transition-colors hover:bg-white/10"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            <div className="ml-1 hidden items-center gap-1.5 sm:flex">
              <button
                type="button"
                onClick={() => setMuted((value) => !value)}
                aria-label={muted ? "Включить звук" : "Выключить звук"}
                className="grid h-9 w-9 place-items-center rounded-lg text-ivory/80 transition-colors hover:bg-white/10"
              >
                {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(event) => {
                  setVolume(Number(event.target.value));
                  setMuted(Number(event.target.value) === 0);
                }}
                aria-label="Громкость"
                className="h-1 w-16 cursor-pointer accent-[#a4ad96]"
              />
            </div>

            <span className="mx-1 hidden h-5 w-px bg-white/15 sm:block" />

            <label htmlFor="speed" className="sr-only">
              Скорость воспроизведения
            </label>
            <select
              id="speed"
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="h-8 rounded-md border border-white/15 bg-transparent px-1.5 text-[11px] text-ivory/80"
            >
              {[0.75, 1, 1.25, 1.5].map((value) => (
                <option key={value} value={value} className="bg-[#16231c]">
                  {value}×
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="Полноэкранный режим"
              className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-ivory/80 transition-colors hover:bg-white/10"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11.5px] leading-relaxed text-muted">
          {finished
            ? "Практика до конца таймлайна. Отметьте завершение, чтобы сохранить прогресс."
            : "Прогресс сохраняется автоматически. Можно вернуться к практике позже."}
        </p>
        <button
          type="button"
          onClick={complete}
          disabled={completing}
          className={cn("btn shrink-0", finished ? "btn-primary" : "btn-secondary")}
        >
          {completing ? null : <Check className="h-4 w-4" />}
          {completing ? "Сохраняем…" : "Завершить практику"}
        </button>
      </div>

      {teacherNote ? (
        <div className="mt-5 rounded-[14px] border border-line bg-[#f7f3ea] p-4">
          <p className="text-[10.5px] uppercase tracking-[0.14em] text-muted">Рекомендация преподавателя</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#4d5048]">{teacherNote}</p>
        </div>
      ) : null}
    </div>
  );
}
