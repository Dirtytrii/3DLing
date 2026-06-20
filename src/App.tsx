import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { SceneBackground } from "./components/SceneBackground";
import { StageCanvas } from "./components/StageCanvas";
import { StorySection } from "./components/StorySection";
import { scenes, wallPhotos } from "./data/scenes";

const getHashSectionId = () => {
  const hash = window.location.hash.replace("#", "");
  if (hash === "letter" || hash === "wall" || scenes.some((scene) => scene.id === hash)) return hash;
  return null;
};

const getInitialSectionId = () => getHashSectionId() ?? scenes[0].id;

const getInitialStageSceneId = () => {
  const hash = getHashSectionId();
  return scenes.some((scene) => scene.id === hash) ? hash : scenes[0].id;
};

const scrollToSection = (id: string, behavior: ScrollBehavior) => {
  const target = document.getElementById(id);
  target?.scrollIntoView({ block: "start", inline: "nearest", behavior });
};

function App() {
  const [activeSectionId, setActiveSectionId] = useState(getInitialSectionId);
  const [stageSceneId, setStageSceneId] = useState(getInitialStageSceneId);
  const activeScene = useMemo(
    () => scenes.find((scene) => scene.id === stageSceneId) ?? scenes[0],
    [stageSceneId]
  );

  useEffect(() => {
    scenes.forEach((scene) => {
      if (!scene.backgroundAsset?.imagePath) return;
      const image = new Image();
      image.decoding = "async";
      image.src = scene.backgroundAsset.imagePath;
    });
  }, []);

  useLayoutEffect(() => {
    const hashId = getHashSectionId();
    if (!hashId) return;

    const frame = window.requestAnimationFrame(() => scrollToSection(hashId, "auto"));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hashId = getHashSectionId();
      if (!hashId) return;

      setActiveSectionId(hashId);
      if (scenes.some((scene) => scene.id === hashId)) {
        setStageSceneId(hashId);
      }

      window.requestAnimationFrame(() => scrollToSection(hashId, "smooth"));
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-scene], #letter, #wall"));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = visible?.target.getAttribute("data-scene") ?? visible?.target.id;
        if (id) {
          setActiveSectionId(id);
          if (scenes.some((scene) => scene.id === id)) {
            setStageSceneId(id);
          }
        }
      },
      { threshold: [0.42, 0.58, 0.74] }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <main>
      <SceneBackground scene={activeScene} />
      <StageCanvas scene={activeScene} />

      <nav className="scene-rail" aria-label="场景导航">
        {scenes.map((scene) => (
          <a
            key={scene.id}
            href={`#${scene.id}`}
            className={scene.id === activeSectionId ? "active" : ""}
            aria-label={`跳到${scene.title}`}
          />
        ))}
        <a href="#letter" className={activeSectionId === "letter" ? "active" : ""} aria-label="跳到告白" />
        <a href="#wall" className={`heart-dot ${activeSectionId === "wall" ? "active" : ""}`} aria-label="跳到照片墙" />
      </nav>

      <div className="story-flow">
        {scenes.map((scene) => (
          <StorySection key={scene.id} scene={scene} active={scene.id === activeSectionId} />
        ))}

        <section className="letter-section" id="letter">
          <div className="letter-inner">
            <p className="scene-count">07</p>
            <h2>写给以后</h2>
            <p>
              这些不是一次做完就结束的页面。以后每一次一起出去玩、每一张想留下来的照片、每一个突然想起的瞬间，都可以继续放进这里。
            </p>
            <p>
              我想把它慢慢变成只属于我们的收藏柜：左边是照片，右边是你每个阶段的小玩偶，中间是我一直在场的目光。
            </p>
          </div>
        </section>

        <section className="wall-section" id="wall">
          <div className="wall-heading">
            <p className="scene-count">NEXT</p>
            <h2>照片墙</h2>
            <p>以后继续更新。</p>
          </div>
          <div className="photo-wall">
            {wallPhotos.map((photo) => (
              <figure key={photo.id}>
                <img src={photo.src} alt={`${photo.title}照片`} loading="lazy" decoding="async" />
                <figcaption>{photo.title}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
