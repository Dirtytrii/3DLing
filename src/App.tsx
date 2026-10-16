import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { SceneBackground } from "./components/SceneBackground";
import { DreamStageCanvas } from "./components/DreamStageCanvas";
import { StorySection } from "./components/StorySection";
import { GiftNavigation } from "./components/GiftNavigation";
import { BirthdaySection } from "./components/BirthdaySection";
import { LetterSection } from "./components/LetterSection";
import { scenes, sections } from "./data/dreamScenes";
import { gift } from "./data/gift";
import { wallPhotos } from "./data/scenes";
import { ArrowIcon } from "./components/ArrowIcon";
import { LoadingScreen } from "./components/LoadingScreen";
import { prepareGiftResources, resourceCount, type ResourceProgress } from "./lib/resources";

const sectionFromHash = () => {
  const id = window.location.hash.slice(1);
  return sections.some((section) => section.id === id) ? id : "intro";
};
function App() {
  const [active, setActive] = useState(sectionFromHash);
  const [stageId, setStageId] = useState(() => scenes.find((scene) => scene.id === sectionFromHash())?.id ?? scenes[0].id);
  const [ready, setReady] = useState(false);
  const [resources, setResources] = useState<ResourceProgress>({ completed: 0, failed: [], done: false });
  const [attempt, setAttempt] = useState(0);
  const [preparedTextures, setPreparedTextures] = useState(0);
  const [stageError, setStageError] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const entryFocused = useRef(false);
  const [letterRequest, setLetterRequest] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const activeScene = scenes.find((scene) => scene.id === stageId) ?? scenes[0];
  const isMemory = scenes.some((scene) => scene.id === active);
  const onPrepared = useCallback((count: number) => setPreparedTextures(count), []);
  const onPrepareError = useCallback(() => setStageError(true), []);
  const retry = () => { setStageError(false); setPreparedTextures(0); setResources((value) => ({ ...value, failed: [], done: false })); setAttempt((value) => value + 1); };
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    let cancelled = false;
    void prepareGiftResources((progress) => { if (!cancelled) setResources(progress); });
    return () => { cancelled = true; };
  }, [attempt]);
  useEffect(() => {
    if (ready || !resources.done || preparedTextures !== scenes.length || stageError) return;
    setLeaving(true);
    const timer = window.setTimeout(() => {
      setReady(true);
    }, reducedMotion ? 0 : 700);
    return () => window.clearTimeout(timer);
  }, [resources.done, preparedTextures, stageError, reducedMotion, ready]);
  useEffect(() => {
    if (!ready || entryFocused.current) return;
    entryFocused.current = true;
    const heading = document.getElementById(active)?.querySelector<HTMLElement>("h1,h2");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
    // Transfer focus once when the loading cover leaves, not during scrolling.
  }, [ready, active]);
  useLayoutEffect(() => {
    document.documentElement.classList.toggle("gift-is-loading", !ready);
    return () => document.documentElement.classList.remove("gift-is-loading");
  }, [ready]);
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => document.getElementById(sectionFromHash())?.scrollIntoView({ behavior: "instant", block: "start" }));
    return () => cancelAnimationFrame(frame);
  }, [ready]);
  useLayoutEffect(() => {
    // A shorter window changes every preceding full-height section. Keep the
    // current scene aligned; long reading surfaces keep native scroll anchoring.
    const align = () => {
      if (active === "letter" || active === "wall") return;
      document.getElementById(active)?.scrollIntoView({ behavior: "instant", block: "start" });
    };
    window.addEventListener("resize", align);
    return () => window.removeEventListener("resize", align);
  }, [active]);
  useEffect(() => {
    const synchronize = () => {
      const id = sectionFromHash(); setActive(id);
      if (scenes.some((scene) => scene.id === id)) setStageId(id);
      document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion || !ready ? "instant" : "smooth", block: "start" });
    };
    window.addEventListener("hashchange", synchronize);
    return () => window.removeEventListener("hashchange", synchronize);
  }, [reducedMotion, ready]);
  useEffect(() => {
    if (!ready) return;
    const intersecting = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      // Entries are changes, not a complete visibility snapshot. A long letter
      // may stay intersecting after the preceding section leaves the band.
      entries.forEach((entry) => entry.isIntersecting ? intersecting.add(entry.target) : intersecting.delete(entry.target));
      const anchor = innerHeight * .375;
      const visible = [...intersecting].find((section) => {
        const bounds = section.getBoundingClientRect();
        return bounds.top <= anchor && bounds.bottom > anchor;
      }) ?? [...intersecting][0];
      if (!visible) return;
      const id = visible.id; setActive(id);
      if (scenes.some((scene) => scene.id === id)) setStageId(id);
    }, { rootMargin: "-30% 0px -55% 0px", threshold: 0 });
    document.querySelectorAll<HTMLElement>("[data-section]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [ready]);
  const openLetter = () => {
    setLetterRequest((value) => value + 1);
    window.location.hash = "letter";
    // Scrolling can leave the hash unchanged; assignment alone cannot reopen it.
    document.getElementById("letter")?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
  };
  return (
    <main className={`app-shell ${ready ? "is-ready" : "is-booting"} ${leaving && !ready ? "is-entering" : ""}`} data-app-ready={String(ready)} data-active-section={active} style={{ "--quiet-art": `url("${gift.art.quiet}")`, "--paper-art": `url("${gift.art.paper}")`, "--envelope-art": `url("${gift.art.envelope}")` } as CSSProperties}>
      <div className={`memory-environment ${isMemory ? "is-visible" : ""}`} aria-hidden="true"><SceneBackground scene={activeScene} /></div>
      <DreamStageCanvas key={attempt} scene={activeScene} active={resources.done && isMemory} prepare={resources.done} onPrepared={onPrepared} onPrepareError={onPrepareError} reducedMotion={reducedMotion} />
      {!ready && <LoadingScreen completed={resources.completed + preparedTextures} total={resourceCount + scenes.length} failed={resources.failed.length + Number(stageError)} leaving={leaving} onRetry={retry} />}
      <div className="gift-content" inert={!ready} aria-busy={!ready}>
      <GiftNavigation active={active} />
      <div className="story-flow">
        <section id="intro" data-section="intro" className={`intro-section gift-section ${active === "intro" ? "is-active" : ""}`}>
          <img className="section-art" src={gift.art.intro} alt="" aria-hidden="true" fetchPriority="high" decoding="async" />
          <div className="gift-copy intro-copy"><h1>给你的<br />生日礼物</h1><p className="gift-subtitle">从第一段回忆，慢慢看起。</p><div className="gift-actions"><a className="button-primary" href="#sence1">打开礼物</a><a className="text-link" href="#birthday">直接去许愿 <ArrowIcon /></a></div></div>
          <a className="scroll-invitation" href="#sence1">向下，开始回忆 <ArrowIcon direction="down" /></a>
        </section>
        {scenes.map((scene, index) => <StorySection key={scene.id} scene={scene} active={active === scene.id} previous={scenes[index - 1]?.id ?? "intro"} next={scenes[index + 1]?.id ?? "birthday"} last={index === scenes.length - 1} />)}
        <BirthdaySection active={active === "birthday"} reducedMotion={reducedMotion} onOpenLetter={openLetter} />
        <LetterSection active={active === "letter"} request={letterRequest} reducedMotion={reducedMotion} />
        <section className="wall-section quiet-section" id="wall" data-section="wall"><div className="wall-layout"><div className="wall-heading"><h2>照片墙</h2><p>以后继续更新。</p></div><div className="photo-wall">{wallPhotos.map((photo) => <figure key={photo.id}><a href={`#${photo.id}`} aria-label={`回看${photo.title}`}><img src={photo.src} alt={`${photo.title}照片`} loading="lazy" decoding="async" /><figcaption>{photo.title}</figcaption></a></figure>)}</div></div><div className="wall-pager"><a className="text-link" href="#birthday"><ArrowIcon direction="left" />再许个愿</a><a className="text-link" href="#intro">回到开头 <ArrowIcon direction="up" /></a></div></section>
      </div>
      </div>
    </main>
  );
}
export default App;
