import { useEffect, useId, useRef, type CSSProperties } from "react";

// Neutral gray means zero displacement. Fade the wind in below the suspension
// edge so the paper bends progressively, while native text stays on its own plane.
function suspensionMask(height: number) {
  const held = Math.min(.16, 96 / height), soft = Math.min(.78, 640 / height);
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="512"><defs><linearGradient id="a" x2="0" y2="1"><stop stop-color="white" stop-opacity="0"/><stop offset="${held}" stop-color="white" stop-opacity="0"/><stop offset="${soft}" stop-color="white" stop-opacity=".65"/><stop offset="1" stop-color="white"/></linearGradient></defs><path fill="url(#a)" d="M0 0h64v512H0z"/></svg>`)}`;
}
const initialSuspension = suspensionMask(610);

export function PaperBreeze({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const id = `paper-wind-${useId().replace(/:/g, "")}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const materialRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<SVGFEImageElement>(null);
  const filterRef = useRef<SVGFilterElement>(null);

  useEffect(() => {
    const material = materialRef.current, mask = maskRef.current;
    if (!material || !mask) return;
    // Keep suspension weights aligned with the complete sheet after long-letter
    // layout and desktop resizing; no geometry is measured on animation frames.
    let width = 0, height = 0;
    const measure = () => {
      if (width === material.offsetWidth && height === material.offsetHeight) return;
      width = material.offsetWidth; height = material.offsetHeight;
      mask.setAttribute("width", String(width));
      mask.setAttribute("height", String(height));
      mask.setAttribute("href", suspensionMask(height));
      filterRef.current?.setAttribute("width", String(width + 192));
      filterRef.current?.setAttribute("height", String(height + 192));
      // Keep the larger hanging sway within the reading margins on very long sheets.
      material.style.setProperty("--paper-sway-gain", String(Math.min(1, 24 / (height * Math.tan(.65 * Math.PI / 180)))));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(material);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svg = svgRef.current, material = materialRef.current;
    if (!svg || !material) return;
    const sync = () => {
      const selection = window.getSelection();
      const selected = !!selection && !selection.isCollapsed && !!selection.anchorNode && !!material.parentElement?.contains(selection.anchorNode);
      const running = active && !reducedMotion && !document.hidden && !selected;
      material.dataset.breeze = running ? "running" : "paused";
      if (running) svg.unpauseAnimations();
      else svg.pauseAnimations();
      if (reducedMotion) svg.setCurrentTime(0);
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    document.addEventListener("selectionchange", sync);
    return () => {
      svg.pauseAnimations();
      document.removeEventListener("visibilitychange", sync);
      document.removeEventListener("selectionchange", sync);
    };
  }, [active, reducedMotion]);

  return <>
    <svg ref={svgRef} className="paper-wind-defs" aria-hidden="true" focusable="false">
      <defs>
        <filter ref={filterRef} id={id} filterUnits="userSpaceOnUse" x="-96" y="-96" width="972" height="802" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".003 .0015" numOctaves="1" seed="8" result="grain" />
          <feOffset in="grain" result="drift">
            <animate attributeName="dx" values="0;48;0;-40;0" dur="12s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.25;.5;.75;1" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1;.45 0 .55 1" />
            <animate attributeName="dy" values="0;32;0;-26;0" dur="12s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.25;.5;.75;1" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1;.45 0 .55 1" />
          </feOffset>
          <feImage ref={maskRef} href={initialSuspension} x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="suspension" />
          <feComposite in="drift" in2="suspension" operator="in" result="bending" />
          <feFlood floodColor="#808080" result="neutral" />
          <feComposite in="bending" in2="neutral" operator="over" result="wind" />
          <feDisplacementMap in="SourceGraphic" in2="wind" scale="-110" xChannelSelector="R" yChannelSelector="G">
            <animate attributeName="scale" values="-110;160;65;-140;-110" dur="12s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.25;.5;.75;1" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1;.45 0 .55 1" />
          </feDisplacementMap>
        </filter>
      </defs>
    </svg>
    <div ref={materialRef} className="paper-fabric" data-breeze="paused" aria-hidden="true" style={{ "--paper-wind-filter": `url(#${id})` } as CSSProperties}>
      <i className="paper-breeze-light" />
    </div>
  </>;
}
