import { useEffect, useRef, useState } from "react";
import { gift } from "../data/gift";
import { ArrowIcon } from "./ArrowIcon";

type LetterState = "sealed" | "opening" | "reading";

export function LetterSection({ active, request, reducedMotion }: { active: boolean; request: number; reducedMotion: boolean }) {
  const [state, setState] = useState<LetterState>("sealed");
  const consumed = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const open = () => setState(reducedMotion ? "reading" : "opening");
  const body: string = gift.letter.body;

  useEffect(() => {
    if (active && request > consumed.current) {
      consumed.current = request;
      setState(reducedMotion ? "reading" : "opening");
    }
    if (!active && state === "opening") setState("sealed");
  }, [active, request, reducedMotion, state]);

  useEffect(() => {
    if (state !== "opening") return;
    const timer = window.setTimeout(() => setState("reading"), 1750);
    return () => window.clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    if (active && state === "reading") heading.current?.focus({ preventScroll: true });
  }, [state, active]);

  return (
    <section className={`letter-section quiet-section letter-${state} ${active ? "is-active" : ""}`} id="letter" data-section="letter" data-letter-state={state}>
      <div className="letter-stage">
        <div className="envelope-rig" aria-hidden="true">
          <div className="envelope-back" />
          <div className="envelope-flap" />
          <div className="envelope-sheet" />
          <div className="envelope-front"><svg className="star-seal" viewBox="0 0 100 100"><path d="m50 7 13 27 30 4-22 22 5 30-26-14-27 14 6-30L7 38l30-4Z"/></svg></div>
        </div>
        <div className="letter-invitation">
          <h2>给你的一封信</h2>
          <button className="button-primary" type="button" onClick={open}>打开信 <ArrowIcon direction="up-right" /></button>
        </div>
        <article className="letter-paper" aria-hidden={state !== "reading"} inert={state !== "reading"}>
          <h2 ref={heading} tabIndex={-1}>{gift.letter.title}</h2>
          {state === "reading" && <div className="letter-body">{body.trim() ? body.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p className="letter-placeholder">信件原文待放入</p>}</div>}
        </article>
      </div>
      <p className="sr-only" aria-live="polite">{state === "opening" ? "正在打开信封" : state === "reading" ? "信纸已展开" : ""}</p>
      <div className="section-pager letter-pager">
        <a className="text-link" href="#birthday"><ArrowIcon direction="left" /><span>回到生日</span></a>
        {state === "opening" ? <button className="text-link" type="button" onClick={() => setState("reading")}>直接读信 <ArrowIcon /></button> : <a className="button-primary button-small" href="#wall">看看照片墙 <ArrowIcon /></a>}
      </div>
    </section>
  );
}
