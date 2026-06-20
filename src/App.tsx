import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { LoadingScreen } from "./components/LoadingScreen";
import { SceneBackground } from "./components/SceneBackground";
import { StageCanvas } from "./components/StageCanvas";
import { StorySection } from "./components/StorySection";
import { scenes, type StoryScene, wallPhotos } from "./data/scenes";

const BOOT_MIN_MS = 1100;
const BOOT_ASSET_TIMEOUT_MS = 20000;
const BOOT_RENDER_TIMEOUT_MS = 30000;

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

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

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const preloadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const image = new Image();
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve();
    };

    const timer = window.setTimeout(finish, BOOT_ASSET_TIMEOUT_MS);
    image.decoding = "async";
    image.onload = finish;
    image.onerror = finish;
    image.src = src;
    if (image.complete) finish();
  });

const waitForInitialSceneRender = (scene: StoryScene) =>
  new Promise<void>((resolve) => {
    const started = window.performance.now();

    const check = () => {
      const stage = document.querySelector<HTMLElement>(".stage-canvas");
      const activeBackground = document.querySelector<HTMLElement>(".scene-background-layer.is-active");
      const spriteExpected = !!scene.toyDisplay && scene.toyDisplay.assetReady !== false;
      const modelReady = stage?.dataset.modelState === (spriteExpected ? "sprite" : "placeholder");
      const spriteReady = !spriteExpected || stage?.dataset.spriteLoaded === "true";
      const stageProfile = scene.stage.profile ?? "default";
      const stageReady = stage?.dataset.stageProfile === stageProfile;
      const backgroundReady = activeBackground?.dataset.backgroundScene === scene.id;
      const timedOut = window.performance.now() - started > BOOT_RENDER_TIMEOUT_MS;

      if ((stageReady && backgroundReady && modelReady && spriteReady) || timedOut) {
        resolve();
        return;
      }

      window.requestAnimationFrame(check);
    };

    window.requestAnimationFrame(check);
  });

const waitForInitialPhoto = (scene: StoryScene) =>
  new Promise<void>((resolve) => {
    let settled = false;
    let cleanup = () => {};

    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const timeout = window.setTimeout(finish, BOOT_ASSET_TIMEOUT_MS);
    const bindImage = () => {
      if (settled) return;
      const image = document.querySelector<HTMLImageElement>(`#${scene.id} .photo-stack img`);
      if (!image) {
        window.requestAnimationFrame(bindImage);
        return;
      }

      if (image.complete && image.naturalWidth > 0) {
        finish();
        return;
      }

      const onDone = () => finish();
      image.addEventListener("load", onDone, { once: true });
      image.addEventListener("error", onDone, { once: true });
      cleanup = () => {
        window.clearTimeout(timeout);
        image.removeEventListener("load", onDone);
        image.removeEventListener("error", onDone);
      };
    };

    cleanup = () => window.clearTimeout(timeout);
    bindImage();
  });

function App() {
  const [activeSectionId, setActiveSectionId] = useState(getInitialSectionId);
  const [stageSceneId, setStageSceneId] = useState(getInitialStageSceneId);
  const [bootReady, setBootReady] = useState(false);
  const activeScene = useMemo(
    () => scenes.find((scene) => scene.id === stageSceneId) ?? scenes[0],
    [stageSceneId]
  );

  useEffect(() => {
    if (bootReady) return;

    let cancelled = false;

    const boot = async () => {
      await Promise.allSettled([
        wait(BOOT_MIN_MS),
        waitForInitialPhoto(activeScene),
        waitForInitialSceneRender(activeScene)
      ]);

      if (!cancelled) {
        setBootReady(true);
      }
    };

    void boot();

    return () => {
      cancelled = true;
    };
  }, [activeScene, bootReady]);

  useEffect(() => {
    if (!bootReady) return;

    const idleWindow = window as IdleWindow;
    const preloadRest = () => {
      scenes.forEach((scene) => {
        if (!scene.backgroundAsset?.imagePath || scene.id === activeScene.id) return;
        void preloadImage(scene.backgroundAsset.imagePath);
      });
    };

    if (idleWindow.requestIdleCallback) {
      const handle = idleWindow.requestIdleCallback(preloadRest, { timeout: 3000 });
      return () => idleWindow.cancelIdleCallback?.(handle);
    }

    const timer = window.setTimeout(preloadRest, 1400);
    return () => window.clearTimeout(timer);
  }, [activeScene.id, bootReady]);

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
    <main className={`app-shell ${bootReady ? "is-ready" : "is-booting"}`} data-app-ready={bootReady ? "true" : "false"}>
      <SceneBackground scene={activeScene} />
      <StageCanvas scene={activeScene} />
      <LoadingScreen ready={bootReady} />

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
