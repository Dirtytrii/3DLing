import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gift } from "../data/gift";
import { coverPoint } from "../lib/cover";
import { ArrowIcon } from "./ArrowIcon";

type WishState = "lit" | "blowing" | "celebrating" | "revealed";

export function BirthdaySection({ active, reducedMotion, onOpenLetter }: { active: boolean; reducedMotion: boolean; onOpenLetter: () => void }) {
  const [state, setState] = useState<WishState>("lit");
  const host = useRef<HTMLElement>(null);
  const [flame, setFlame] = useState<CSSProperties>({});

  useEffect(() => {
    const element = host.current!;
    const place = () => {
      const point = coverPoint(element.clientWidth, element.clientHeight, 1586 / 992, gift.art.candle.x, gift.art.candle.y);
      setFlame({ left: point.x, top: point.y, width: point.artHeight * 0.029, height: point.artHeight * 0.079 });
    };
    const observer = new ResizeObserver(place);
    observer.observe(element);
    place();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active && (state === "blowing" || state === "celebrating")) setState("revealed");
  }, [active, state]);

  useEffect(() => {
    if (state !== "blowing" && state !== "celebrating") return;
    const timer = window.setTimeout(() => setState(state === "blowing" ? "celebrating" : "revealed"), state === "blowing" ? 650 : 1900);
    return () => window.clearTimeout(timer);
  }, [state]);

  const finished = state === "celebrating" || state === "revealed";

  return (
    <section ref={host} className={`birthday-section gift-section wish-${state} ${active ? "is-active" : ""}`} id="birthday" data-section="birthday" data-birthday-state={state}>
      <img className="section-art" src={gift.art.birthday} alt="" aria-hidden="true" loading="lazy" decoding="async" />
      {(state === "lit" || state === "blowing") && (
        <div className="candle-flame" style={flame} aria-hidden="true">
          <svg viewBox="0 0 40 100"><path fill="#ffc27b" d="M20 0C18 28 0 49 2 71c1 21 34 29 36 1C40 47 27 27 20 0Z"/><path fill="#fff8ce" d="M21 15C15 41 9 54 10 71c0 18 20 22 22 2 1-17-6-30-11-58Z"/><path fill="#c5a7ff" d="M19 75c-9 5-8 18 1 24 9-6 10-18-1-24Z"/></svg>
        </div>
      )}
      {state === "celebrating" && !reducedMotion && <div className="celebration" aria-hidden="true">{Array.from({ length: 28 }, (_, index) => <i key={index} style={{ "--i": index, "--x": `${(index * 37 + 11) % 100}%`, "--drift": `${((index * 83) % 240) - 120}px` } as CSSProperties} />)}</div>}
      <div className="gift-copy birthday-copy">
        <h2>{finished ? "生日快乐。" : "许个愿吧。"}</h2>
        <p className="gift-subtitle" aria-live="polite">{finished ? gift.wish : "然后，把蜡烛吹灭。"}</p>
        <div className="gift-actions">
          {finished ? <button className="button-primary" type="button" onClick={onOpenLetter}>打开信 <ArrowIcon direction="up-right" /></button> : <button className="button-primary" type="button" disabled={state === "blowing"} onClick={() => setState(reducedMotion ? "revealed" : "blowing")}>{state === "blowing" ? "愿望正在出发…" : "吹灭蜡烛"}</button>}
          {finished && <button className="text-link replay-wish" type="button" onClick={() => setState("lit")}>再许个愿 <ArrowIcon direction="replay" /></button>}
        </div>
      </div>
      <div className="section-pager">
        <a className="text-link" href="#sence6"><ArrowIcon direction="left" /><span>上一幕</span></a>
        <button className="text-link" type="button" onClick={onOpenLetter}>跳过，读信 <ArrowIcon /></button>
      </div>
    </section>
  );
}
