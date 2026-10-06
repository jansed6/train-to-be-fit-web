"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

const LONG_PRESS_MS = 400;
/** Movement (px) that turns a press into a scroll or a swipe. */
const SLOP = 10;
/** Swipe left past this share of the card width to remove it. */
const REMOVE_AT = 0.35;
/** Distance (px) from the viewport edge where a dragged card scrolls the page. */
const SCROLL_EDGE = 90;
const ANIM_MS = 200;

type Gesture =
  | { kind: "press"; index: number; pointerId: number; x0: number; y0: number; timer: number }
  | { kind: "swipe"; index: number; pointerId: number; x0: number }
  | { kind: "drag"; index: number; pointerId: number; y0: number; moved: boolean };

interface Swipe {
  index: number;
  dx: number;
  /** True while the finger is down (no easing). */
  active: boolean;
}

interface Drag {
  from: number;
  over: number;
  /** Centre of the lifted row, in page coordinates. */
  center: number;
}

/** A row's measured box while dragging, in page coordinates. */
interface Slot {
  top: number;
  height: number;
}

/**
 * Cards you can reorder and remove by touch: hold a card to lift it (all cards
 * collapse to compact rows so it's easy to move), swipe one left to remove it.
 */
export function ExerciseList<T extends { id: string }>({
  items,
  renderCard,
  renderCompact,
  onMove,
  onRemove,
}: {
  items: T[];
  renderCard: (item: T, index: number) => ReactNode;
  renderCompact: (item: T, lifted: boolean) => ReactNode;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}) {
  const [swipe, setSwipe] = useState<Swipe | null>(null);
  const [drag, setDragState] = useState<Drag | null>(null);

  // Gesture state lives in refs so the window listeners (bound once) see it.
  const gesture = useRef<Gesture | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const slots = useRef<Slot[]>([]);
  const pointerY = useRef(0);
  const busy = useRef(false); // a swiped card is animating out
  const landed = useRef<number | null>(null);
  const touchTarget = useRef<EventTarget | null>(null);
  const listEl = useRef<HTMLDivElement>(null);
  const itemEls = useRef<(HTMLDivElement | null)[]>([]);
  const callbacks = useRef({ onMove, onRemove });
  callbacks.current = { onMove, onRemove };

  function setDrag(d: Drag | null) {
    dragRef.current = d;
    setDragState(d);
  }

  // Stops the page scrolling while a card is swiped or dragged. Bound to the
  // list (so the browser treats touches there as cancelable) and to the touched
  // element itself, which keeps receiving touchmove even after collapsing
  // unmounts it.
  const blockScroll = useCallback((e: TouchEvent) => {
    const g = gesture.current;
    if (g && g.kind !== "press" && e.cancelable) e.preventDefault();
  }, []);

  function releaseTouchTarget() {
    touchTarget.current?.removeEventListener("touchmove", blockScroll as EventListener);
    touchTarget.current = null;
  }

  function updateDrag() {
    const d = dragRef.current;
    const s = slots.current;
    if (!d || s.length === 0) return;
    const center = pointerY.current + window.scrollY;
    let over = 0;
    s.forEach((slot, i) => {
      if (i !== d.from && slot.top + slot.height / 2 < center) over++;
    });
    setDrag({ ...d, over, center });
  }

  function startDrag(index: number, pointerId: number) {
    gesture.current = { kind: "drag", index, pointerId, y0: pointerY.current, moved: false };
    slots.current = [];
    try {
      navigator.vibrate?.(15);
    } catch {
      // vibration not supported — ignore
    }
    setDrag({ from: index, over: index, center: 0 });
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>, index: number) {
    if (gesture.current || busy.current) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const onControl = !!(e.target as HTMLElement).closest("input, textarea, select, button");
    // With a mouse, presses on inputs/buttons stay plain clicks and text selection.
    if (onControl && e.pointerType === "mouse") return;

    pointerY.current = e.clientY;
    const g: Gesture = {
      kind: "press",
      index,
      pointerId: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      timer: 0,
    };
    // Long-press lifts the card; on inputs/buttons a press only starts a swipe.
    if (!onControl) {
      g.timer = window.setTimeout(() => startDrag(index, e.pointerId), LONG_PRESS_MS);
    }
    gesture.current = g;

    if (e.pointerType === "touch") {
      touchTarget.current = e.target;
      e.target.addEventListener("touchmove", blockScroll as EventListener, { passive: false });
    } else {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  }

  useEffect(() => {
    const list = listEl.current;
    list?.addEventListener("touchmove", blockScroll, { passive: false });

    function onMoveEvent(e: PointerEvent) {
      const g = gesture.current;
      if (!g || e.pointerId !== g.pointerId) return;
      pointerY.current = e.clientY;

      if (g.kind === "press") {
        const dx = e.clientX - g.x0;
        const dy = e.clientY - g.y0;
        if (Math.abs(dx) > SLOP && Math.abs(dx) > Math.abs(dy)) {
          clearTimeout(g.timer);
          gesture.current = { kind: "swipe", index: g.index, pointerId: g.pointerId, x0: g.x0 };
          setSwipe({ index: g.index, dx, active: true });
        } else if (Math.abs(dy) > SLOP) {
          // A vertical move is a scroll — let the browser have it.
          clearTimeout(g.timer);
          gesture.current = null;
          releaseTouchTarget();
        }
      } else if (g.kind === "swipe") {
        const dx = e.clientX - g.x0;
        setSwipe({ index: g.index, dx: dx > 0 ? dx / 5 : dx, active: true });
      } else {
        if (Math.abs(e.clientY - g.y0) > SLOP) g.moved = true;
        updateDrag();
      }
    }

    function onEnd(e: PointerEvent, cancelled: boolean) {
      const g = gesture.current;
      if (!g || e.pointerId !== g.pointerId) return;
      gesture.current = null;
      releaseTouchTarget();

      if (g.kind === "press") {
        clearTimeout(g.timer);
      } else if (g.kind === "swipe") {
        const width = itemEls.current[g.index]?.offsetWidth ?? 0;
        const dx = e.clientX - g.x0;
        if (!cancelled && dx < -width * REMOVE_AT) {
          busy.current = true;
          setSwipe({ index: g.index, dx: -width - 24, active: false });
          window.setTimeout(() => {
            busy.current = false;
            setSwipe(null);
            callbacks.current.onRemove(g.index);
          }, ANIM_MS);
        } else {
          setSwipe({ index: g.index, dx: 0, active: false });
          window.setTimeout(
            () => setSwipe((s) => (s && !s.active && s.dx === 0 ? null : s)),
            ANIM_MS,
          );
        }
      } else {
        const d = dragRef.current;
        if (d) {
          const to = cancelled ? d.from : d.over;
          if (to !== d.from) callbacks.current.onMove(d.from, to);
          landed.current = to;
        }
        setDrag(null);
      }
    }

    const onUp = (e: PointerEvent) => onEnd(e, false);
    const onCancel = (e: PointerEvent) => onEnd(e, true);
    window.addEventListener("pointermove", onMoveEvent);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      list?.removeEventListener("touchmove", blockScroll);
      window.removeEventListener("pointermove", onMoveEvent);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      const g = gesture.current;
      if (g?.kind === "press") clearTimeout(g.timer);
    };
  }, []); // listeners only read refs, so they're bound once

  const dragFrom = drag?.from ?? null;

  // Once the cards have collapsed: measure the rows and scroll so the lifted
  // one sits under the finger.
  useLayoutEffect(() => {
    if (dragFrom === null) {
      // Dropped: bring the moved card (now full size again) into view.
      if (landed.current !== null) {
        itemEls.current[landed.current]?.scrollIntoView({ block: "nearest" });
        landed.current = null;
      }
      return;
    }
    slots.current = items.map((_item, i) => {
      const r = itemEls.current[i]!.getBoundingClientRect();
      return { top: r.top + window.scrollY, height: r.height };
    });
    const s = slots.current[dragFrom];
    window.scrollTo(0, s.top + s.height / 2 - pointerY.current);
    updateDrag();
  }, [dragFrom]);

  // Scroll the page while a lifted card is held near the top or bottom edge.
  useEffect(() => {
    if (dragFrom === null) return;
    let raf = 0;
    const tick = () => {
      const g = gesture.current;
      if (g?.kind === "drag" && g.moved) {
        const y = pointerY.current;
        const vh = window.innerHeight;
        let v = 0;
        if (y < SCROLL_EDGE) v = -Math.ceil((SCROLL_EDGE - y) / 6);
        else if (y > vh - SCROLL_EDGE) v = Math.ceil((y - (vh - SCROLL_EDGE)) / 6);
        const before = window.scrollY;
        if (v) window.scrollBy(0, v);
        if (window.scrollY !== before) updateDrag();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dragFrom]);

  const s = slots.current;
  const measured = drag !== null && s.length === items.length;
  // How far the other rows move to make room for the lifted one.
  const shift =
    measured && s.length > 1
      ? s[drag.from].height + (s[1].top - s[0].top - s[0].height)
      : 0;

  return (
    <div ref={listEl} className={cn("flex flex-col", drag ? "gap-2" : "gap-4")}>
      {items.map((item, i) => {
        const lifted = drag !== null && i === drag.from;
        let y = 0;
        if (measured) {
          if (lifted) y = drag.center - (s[i].top + s[i].height / 2);
          else if (drag.from < i && i <= drag.over) y = -shift;
          else if (drag.over <= i && i < drag.from) y = shift;
        }
        const sw = swipe?.index === i ? swipe : null;

        return (
          <div
            key={item.id}
            ref={(el) => {
              itemEls.current[i] = el;
            }}
            className={cn(
              "relative scroll-mt-20 touch-pan-y touch-pinch-zoom select-none [-webkit-touch-callout:none]",
              lifted ? "z-10" : drag && "transition-transform duration-200",
            )}
            style={y ? { transform: `translateY(${y}px)` } : undefined}
            onPointerDown={(e) => onPointerDown(e, i)}
            onContextMenu={(e) => {
              // Android opens a context menu on long-press; keep it for inputs.
              if (!(e.target as HTMLElement).closest("input, textarea")) e.preventDefault();
            }}
          >
            {sw && (
              <div className="absolute inset-0 flex items-center justify-end rounded-card bg-red-500 pr-6 font-semibold text-white">
                Remove
              </div>
            )}
            <div
              className={cn("relative", sw && !sw.active && "transition-transform duration-200")}
              style={sw ? { transform: `translateX(${sw.dx}px)` } : undefined}
            >
              {drag ? renderCompact(item, lifted) : renderCard(item, i)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
