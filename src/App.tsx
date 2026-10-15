import { useEffect, useLayoutEffect, useState } from "react";
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

const sectionFromHash = () => {
  const id = window.location.hash.slice(1);
  return sections.some((section) => section.id === id) ? id : "intro";
};
function preload(src: string) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    const timeout = window.setTimeout(resolve, 12000);
    const finish = () => { window.clearTimeout(timeout); resolve(); };
    image.decoding = "async"; image.onload = finish; image.onerror = finish; image.src = src;
    if (image.complete) finish();
  });
}
function App() {
  const [active, setActive] = useState(sectionFromHash);
  const [stageId, setStageId] = useState(() => scenes.find((scene) => scene.id === sectionFromHash())?.id ?? scenes[0].id);
  const [ready, setReady] = useState(false);
  const [letterRequest, setLetterRequest] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const activeScene = scenes.find((scene) => scene.id === stageId) ?? scenes[0];
  const isMemory = scenes.some((scene) => scene.id === active);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    let cancelled = false;
    const initial = sectionFromHash();
    const scene = scenes.find((item) => item.id === initial);
    const assets = scene ? [scene.art.src, scene.mainPhoto, scene.toyDisplay!.imagePath] : [initial === "intro" ? gift.art.intro : initial === "birthday" ? gift.art.birthday : gift.art.quiet];
    void Promise.all(assets.map(preload)).then(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const index = scenes.findIndex((scene) => scene.id === active);
    const next = scenes[index < 0 ? 0 : Math.min(index + 1, scenes.length - 1)];
    const timer = window.setTimeout(() => {
      void preload(next.art.src); void preload(next.toyDisplay!.imagePath);
      if (active === "intro" || active === "sence6") void preload(gift.art.birthday);
      if (active === "birthday") void preload(gift.art.quiet);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [active, ready]);
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => document.getElementById(sectionFromHash())?.scrollIntoView({ behavior: "instant", block: "start" }));
    return () => cancelAnimationFrame(frame);
  }, []);
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
      document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
    };
    window.addEventListener("hashchange", synchronize);
    return () => window.removeEventListener("hashchange", synchronize);
  }, [reducedMotion]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (!visible) return;
      const id = visible.target.id; setActive(id);
      if (scenes.some((scene) => scene.id === id)) setStageId(id);
    }, { rootMargin: "-30% 0px -55% 0px", threshold: 0 });
    document.querySelectorAll<HTMLElement>("[data-section]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  const openLetter = () => {
    setLetterRequest((value) => value + 1);
    window.location.hash = "letter";
    // Scrolling can leave the hash unchanged; assignment alone cannot reopen it.
    document.getElementById("letter")?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
  };
  return (
    <main className={`app-shell ${ready ? "is-ready" : "is-booting"}`} data-app-ready={String(ready)} data-active-section={active}>
      <div className={`memory-environment ${isMemory ? "is-visible" : ""}`} aria-hidden="true"><SceneBackground scene={activeScene} /></div>
      <DreamStageCanvas scene={activeScene} active={isMemory} reducedMotion={reducedMotion} />
      <GiftNavigation active={active} />
      {!ready && <div className="loading-screen" role="status"><span className="wordmark">Ling</span><span>礼物正在准备中</span><i /></div>}
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
    </main>
  );
}
export default App;
