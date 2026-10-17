import { useEffect, type RefObject } from "react";

type ReadingLine = { paragraph: number; top: number; height: number };

/** Follow real typeset lines without duplicating text or driving page scroll. */
export function useReadingFocus(bodyRef: RefObject<HTMLDivElement | null>, enabled: boolean, content: string) {
  useEffect(() => {
    const body = bodyRef.current;
    if (!body || !enabled) return;
    const paragraphs = [...body.querySelectorAll<HTMLElement>("[data-letter-paragraph]")];
    if (!paragraphs.length) return;
    let lines: ReadingLine[] = [];
    let current = -1, currentParagraph = -1, hovered = -1, pendingHover = -1;
    let frame = 0, hoverTimer = 0, measure = true;
    let source = "scroll";
    const selecting = () => {
      const selection = window.getSelection();
      return !!selection && !selection.isCollapsed && !!selection.anchorNode && body.contains(selection.anchorNode);
    };
    const clearHover = () => { window.clearTimeout(hoverTimer); hoverTimer = 0; pendingHover = -1; };
    const measureLines = () => {
      lines = [];
      paragraphs.forEach((paragraph, index) => {
        const bounds = paragraph.getBoundingClientRect();
        const top = paragraph.offsetTop;
        const height = parseFloat(getComputedStyle(paragraph).lineHeight);
        paragraph.style.setProperty("--paragraph-top", `${top}px`);
        const range = document.createRange();
        range.selectNodeContents(paragraph);
        let previousTop = -Infinity;
        for (const rect of range.getClientRects()) {
          // Explicit newlines and pre-wrap spaces can produce extra fragments
          // for the same line. Measure the native text once, without wrappers.
          if (rect.width < 1 || rect.height < 1 || Math.abs(rect.top - previousTop) < 1) continue;
          lines.push({ paragraph: index, top: top + rect.top - bounds.top + (rect.height - height) / 2, height });
          previousTop = rect.top;
        }
      });
      measure = false;
    };
    const nearestLine = (anchor: number, paragraph = -1) => {
      let nearest = -1, distance = Infinity;
      lines.forEach((line, index) => {
        if (paragraph >= 0 && line.paragraph !== paragraph) return;
        const next = Math.abs(anchor - (line.top + line.height / 2));
        if (next < distance) { nearest = index; distance = next; }
      });
      return nearest;
    };
    const update = () => {
      frame = 0;
      if (document.hidden) return;
      const selected = selecting();
      body.classList.toggle("has-selection", selected);
      if (selected) return;
      const measured = measure;
      if (measure) measureLines();
      if (!lines.length) return;
      const anchor = innerHeight * .48 - body.getBoundingClientRect().top;
      let index = hovered >= 0 ? hovered : nearestLine(anchor);
      if (!measured && source === "scroll" && current >= 0) {
        const line = lines[current];
        const tolerance = line.height * .16;
        if (anchor >= line.top - tolerance && anchor <= line.top + line.height + tolerance) index = current;
      }
      const line = lines[index];
      if (line.paragraph !== currentParagraph) {
        paragraphs[currentParagraph]?.removeAttribute("data-reading-current");
        paragraphs[line.paragraph].setAttribute("data-reading-current", "true");
        currentParagraph = line.paragraph;
      }
      current = index;
      body.dataset.focusedParagraph = String(line.paragraph);
      body.dataset.focusedLine = String(index);
      body.dataset.focusSource = source;
      body.style.setProperty("--reading-line-top", `${line.top}px`);
      body.style.setProperty("--reading-line-height", `${line.height}px`);
      body.style.setProperty("--reading-guide-top", `${line.top + line.height / 2}px`);
      body.classList.add("has-reading-focus");
    };
    const schedule = () => { if (!frame && !document.hidden) frame = requestAnimationFrame(update); };
    const scroll = () => { clearHover(); hovered = -1; source = "scroll"; schedule(); };
    const resize = () => { measure = true; scroll(); };
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.buttons || selecting()) { clearHover(); return; }
      const paragraph = (event.target as HTMLElement).closest<HTMLElement>("[data-letter-paragraph]");
      if (!paragraph || !body.contains(paragraph)) { clearHover(); return; }
      if (measure) { schedule(); return; }
      const index = nearestLine(event.clientY - body.getBoundingClientRect().top, Number(paragraph.dataset.letterParagraph));
      if (index < 0 || index === hovered) { clearHover(); return; }
      if (index === pendingHover) return;
      clearHover();
      pendingHover = index;
      hoverTimer = window.setTimeout(() => {
        hoverTimer = 0; pendingHover = -1;
        if (document.hidden || selecting()) return;
        hovered = index; source = "pointer"; schedule();
      }, 160);
    };
    const selection = () => { if (selecting()) { clearHover(); hovered = -1; source = "scroll"; } schedule(); };
    const visibility = () => { if (document.hidden) { clearHover(); cancelAnimationFrame(frame); frame = 0; } else resize(); };
    const observer = new ResizeObserver(resize);
    observer.observe(body);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", resize);
    body.addEventListener("pointermove", pointer);
    body.addEventListener("pointerleave", scroll);
    document.addEventListener("selectionchange", selection);
    document.addEventListener("visibilitychange", visibility);
    schedule();
    return () => {
      clearHover(); cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener("scroll", scroll); window.removeEventListener("resize", resize);
      body.removeEventListener("pointermove", pointer); body.removeEventListener("pointerleave", scroll);
      document.removeEventListener("selectionchange", selection); document.removeEventListener("visibilitychange", visibility);
      paragraphs.forEach((paragraph) => { paragraph.removeAttribute("data-reading-current"); paragraph.style.removeProperty("--paragraph-top"); });
      body.classList.remove("has-reading-focus", "has-selection");
      delete body.dataset.focusedParagraph; delete body.dataset.focusedLine; delete body.dataset.focusSource;
      body.style.removeProperty("--reading-line-top"); body.style.removeProperty("--reading-line-height"); body.style.removeProperty("--reading-guide-top");
    };
  }, [bodyRef, enabled, content]);
}
