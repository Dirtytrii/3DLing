import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { gift } from "../data/gift";
import { ArrowIcon } from "./ArrowIcon";
import { useReadingFocus } from "../lib/useReadingFocus";

type LetterState = "sealed" | "opening" | "reading";

export function LetterSection({ active, request, reducedMotion }: { active: boolean; request: number; reducedMotion: boolean }) {
  const [state, setState] = useState<LetterState>("sealed");
  const consumed = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const paperRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [focusEnabled, setFocusEnabled] = useState(true);
  const [paperVisible, setPaperVisible] = useState(false);
  const open = () => setState(reducedMotion ? "reading" : "opening");
  const body: string = gift.letter.body;
  const paragraphs = useMemo(() => body.trim() ? body.split(/\n\s*\n/).filter((paragraph) => paragraph.trim()) : [], [body]);
  useReadingFocus(bodyRef, paperVisible && state === "reading" && focusEnabled && paragraphs.length > 1, body);

  useEffect(() => {
    if (state !== "reading" || !paperRef.current) { setPaperVisible(false); return; }
    // Keyboard focus can expose the top of the paper while the navigation's
    // middle-of-viewport observer still selects the preceding birthday section.
    const observer = new IntersectionObserver(([entry]) => setPaperVisible(entry.isIntersecting));
    observer.observe(paperRef.current);
    return () => observer.disconnect();
  }, [state]);

  useEffect(() => {
    if (active && request > consumed.current) {
      consumed.current = request;
      setState(reducedMotion ? "reading" : "opening");
    }
    if (!active && state === "opening") setState("sealed");
    if (active && reducedMotion && state === "opening") setState("reading");
  }, [active, request, reducedMotion, state]);

  useEffect(() => {
    if (state !== "opening") return;
    const timer = window.setTimeout(() => setState("reading"), 2100);
    return () => window.clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    if (state === "reading") heading.current?.focus({ preventScroll: true });
  }, [state]);

  return (
    <section className={`letter-section quiet-section letter-${state} ${active ? "is-active" : ""}`} id="letter" data-section="letter" data-letter-state={state} style={{ "--stationery-art": `url("${gift.art.stationery}")`, "--paper-edge-art": `url("${gift.art.paperEdge}")`, "--letter-paper-art": `url("${gift.art.letterPaper}")` } as CSSProperties}>
      <div className="letter-stage">
        <div className="envelope-rig" aria-hidden="true">
          <div className="envelope-back" />
          <div className="envelope-sheet"><span className="sheet-ornament">✦</span></div>
          <div className="envelope-front" />
          <div className="envelope-flap" />
          <img className="wax-seal" src={gift.art.seal} alt="" />
        </div>
        <div className="letter-invitation">
          <h2>{gift.letter.title}</h2>
          <button className="button-primary" type="button" onClick={open}>打开信 <ArrowIcon direction="up-right" /></button>
        </div>
        <article ref={paperRef} className="letter-paper" aria-labelledby="letter-title" aria-hidden={state !== "reading"} inert={state !== "reading"}>
          <header className="letter-paper-heading">
            <h2 id="letter-title" ref={heading} tabIndex={-1}>{gift.letter.title}</h2>
            <div className="letter-ornament" aria-hidden="true"><i /><svg viewBox="0 0 32 32"><path d="m16 1 2.8 11.2L30 16l-11.2 2.8L16 31l-2.8-12.2L2 16l11.2-3.8Z"/><path d="m5 5 22 22M27 5 5 27"/></svg><i /></div>
          </header>
          {state === "reading" && paragraphs.length > 1 && <button className="reading-focus-control" type="button" aria-pressed={focusEnabled} onClick={() => setFocusEnabled((value) => !value)}><span aria-hidden="true" />聚焦阅读</button>}
          {state === "reading" && <div ref={bodyRef} className="letter-body">
            <div className="reading-lamp" aria-hidden="true" />
            {paragraphs.length ? paragraphs.map((paragraph, index) => <p key={index} data-letter-paragraph={index}>{paragraph}</p>) : <p className="letter-placeholder">信件原文待放入</p>}
          </div>}
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
