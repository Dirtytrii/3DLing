import { useEffect, type RefObject } from "react";

/** Paragraph focus follows reading, never drives page scrolling. */
export function useReadingFocus(bodyRef: RefObject<HTMLDivElement | null>, enabled: boolean, content: string) {
  useEffect(() => {
    const body = bodyRef.current;
    if (!body || !enabled) return;
    const paragraphs = [...body.querySelectorAll<HTMLElement>("[data-letter-paragraph]")];
    if (!paragraphs.length) return;
    let geometry: { top: number; height: number }[] = [];
    let current = -1, hovered = -1, frame = 0, measure = true;
    let source = "scroll";
    const selecting = () => {
      const selection = window.getSelection();
      return !!selection && !selection.isCollapsed && !!selection.anchorNode && body.contains(selection.anchorNode);
    };
    const update = () => {
      frame = 0;
      if (document.hidden) return;
      const selected = selecting();
      body.classList.toggle("has-selection", selected);
      if (selected) return;
      if (measure) {
        geometry = paragraphs.map((paragraph) => ({ top: paragraph.offsetTop, height: paragraph.offsetHeight }));
        measure = false;
      }
      const anchor = innerHeight * .48 - body.getBoundingClientRect().top;
      let index = hovered;
      if (index < 0) {
        let distance = Infinity;
        for (let candidate = 0; candidate < geometry.length; candidate++) {
          const { top, height } = geometry[candidate];
          const next = anchor < top ? top - anchor : anchor > top + height ? anchor - top - height : 0;
          if (next < distance) { index = candidate; distance = next; }
        }
      }
      if (index !== current) {
        paragraphs[current]?.removeAttribute("data-reading-current");
        paragraphs[index].setAttribute("data-reading-current", "true");
        current = index;
      }
      body.dataset.focusedParagraph = String(index);
      body.dataset.focusSource = source;
      body.style.setProperty("--reading-top", `${geometry[index].top}px`);
      body.style.setProperty("--reading-height", `${geometry[index].height + 20}px`);
      body.classList.add("has-reading-focus");
    };
    const schedule = () => { if (!frame && !document.hidden) frame = requestAnimationFrame(update); };
    const scroll = () => { hovered = -1; source = "scroll"; schedule(); };
    const resize = () => { measure = true; scroll(); };
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.buttons || selecting()) return;
      const paragraph = (event.target as HTMLElement).closest<HTMLElement>("[data-letter-paragraph]");
      if (!paragraph || !body.contains(paragraph)) return;
      hovered = Number(paragraph.dataset.letterParagraph); source = "pointer"; schedule();
    };
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else resize(); };
    const observer = new ResizeObserver(resize);
    observer.observe(body);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", resize);
    body.addEventListener("pointermove", pointer);
    body.addEventListener("pointerleave", scroll);
    document.addEventListener("selectionchange", schedule);
    document.addEventListener("visibilitychange", visibility);
    schedule();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener("scroll", scroll); window.removeEventListener("resize", resize);
      body.removeEventListener("pointermove", pointer); body.removeEventListener("pointerleave", scroll);
      document.removeEventListener("selectionchange", schedule); document.removeEventListener("visibilitychange", visibility);
      paragraphs[current]?.removeAttribute("data-reading-current");
      body.classList.remove("has-reading-focus", "has-selection");
      delete body.dataset.focusedParagraph; delete body.dataset.focusSource;
      body.style.removeProperty("--reading-top"); body.style.removeProperty("--reading-height");
    };
  }, [bodyRef, enabled, content]);
}
