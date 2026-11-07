"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatDuration, parseDuration } from "@/lib/format";
import type { SetRow } from "@/lib/workoutRows";

interface Run {
  rowIdx: number;
  startedAt: number;
  /** The set's time when started; null runs until Stop. */
  target: number | null;
}

/** Two short beeps: iPhones don't vibrate from a web page, so this is the
 *  signal there. The context is made on the Start tap, which lets it play. */
function beep(ctx: AudioContext) {
  const t = ctx.currentTime;
  for (const offset of [0, 0.25]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, t + offset);
    gain.gain.exponentialRampToValueAtTime(0.3, t + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t + offset);
    osc.stop(t + offset + 0.2);
  }
}

function newAudioContext(): AudioContext | null {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    return Ctor ? new Ctor() : null;
  } catch {
    return null;
  }
}

/**
 * Times the next unticked set of a timed exercise. With a time on the set it
 * runs up to it, beeps and ticks the set by itself (no need to reach for the
 * phone mid-plank); without one it runs until Stop. Stop records the time held.
 */
export function SetTimer({
  rows,
  onStart,
  onDone,
}: {
  rows: SetRow[];
  onStart: () => void;
  onDone: (rowIdx: number, seconds: number) => void;
}) {
  const [run, setRun] = useState<Run | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const audioRef = useRef<AudioContext | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!run) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [run]);

  // Let go of the screen and audio if the card goes away mid-set.
  useEffect(
    () => () => {
      wakeLockRef.current?.release().catch(() => {});
      audioRef.current?.close().catch(() => {});
    },
    [],
  );

  const elapsed = run ? Math.max(0, Math.floor((now - run.startedAt) / 1000)) : 0;

  function stop(seconds: number, signal: boolean) {
    if (!run) return;
    const { rowIdx } = run;
    setRun(null);
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
    if (signal) {
      if (audioRef.current) beep(audioRef.current);
      try {
        navigator.vibrate?.(300);
      } catch {
        // vibration not supported — ignore
      }
    }
    if (seconds >= 1) onDone(rowIdx, seconds);
  }

  // Reaching the set's time ends it (also after the phone slept through it).
  useEffect(() => {
    if (run?.target != null && elapsed >= run.target) stop(run.target, true);
  });

  const next = rows.findIndex((r) => !r.done);

  async function start() {
    if (next < 0) return;
    const target = parseDuration(rows[next].time ?? "");
    const startedAt = Date.now();
    setNow(startedAt);
    setRun({ rowIdx: next, startedAt, target: target && target > 0 ? target : null });
    onStart();
    if (!audioRef.current) audioRef.current = newAudioContext();
    audioRef.current?.resume().catch(() => {});
    try {
      wakeLockRef.current = (await navigator.wakeLock?.request("screen")) ?? null;
    } catch {
      // not supported or refused: the screen may sleep, the time stays right
    }
  }

  if (run) {
    const progress = run.target ? Math.min(1, elapsed / run.target) : null;
    return (
      <div className="mt-2 rounded-[14px] bg-surface-2 p-3" aria-live="polite">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">Set {run.rowIdx + 1}</span>
          <span className="text-2xl font-bold tabular-nums">{formatDuration(elapsed)}</span>
          {run.target && (
            <span className="text-sm text-muted tabular-nums">/ {formatDuration(run.target)}</span>
          )}
          <Button variant="primary" size="sm" className="ml-auto" onClick={() => stop(elapsed, false)}>
            ■ Stop
          </Button>
        </div>
        {progress !== null && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
            <div className="h-full bg-accent" style={{ width: `${progress * 100}%` }} />
          </div>
        )}
      </div>
    );
  }

  if (next < 0) return null;

  const target = parseDuration(rows[next].time ?? "");
  return (
    <Button variant="neutral" size="sm" block className="mt-2" onClick={start}>
      ▶ Start set {next + 1}
      {target ? ` · ${formatDuration(target)}` : ""}
    </Button>
  );
}
