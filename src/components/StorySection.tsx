import type { CSSProperties } from "react";
import type { StoryScene } from "../data/scenes";

interface StorySectionProps {
  scene: StoryScene;
  active: boolean;
}

export function StorySection({ scene, active }: StorySectionProps) {
  const stageProfileClass = scene.stage.profile ? ` stage-${scene.stage.profile}` : "";
  const style = {
    "--photo-scene-w": scene.photoLayout?.width,
    "--photo-margin-left": scene.photoLayout?.marginLeft,
    "--photo-desktop-x": scene.photoLayout?.desktopX,
    "--photo-inactive-y": scene.photoLayout?.inactiveY,
    "--photo-active-y": scene.photoLayout?.activeY,
    "--photo-rotate": scene.photoLayout?.rotate,
    "--photo-active-rotate": scene.photoLayout?.activeRotate,
    "--photo-max-height": scene.photoLayout?.maxHeight,
    "--photo-mobile-x": scene.photoLayout?.mobileX,
    "--photo-shadow-one-x": scene.photoLayout?.shadowOneX,
    "--photo-shadow-two-x": scene.photoLayout?.shadowTwoX,
    "--photo-shadow-two-y": scene.photoLayout?.shadowTwoY,
    "--copy-mask-start": scene.copyMask?.desktopStart,
    "--copy-mask-mid": scene.copyMask?.desktopMid,
    "--copy-mask-end": scene.copyMask?.desktopEnd,
    "--copy-mask-mobile-start": scene.copyMask?.mobileStart,
    "--copy-mask-mobile-mid": scene.copyMask?.mobileMid,
    "--copy-mask-mobile-end": scene.copyMask?.mobileEnd
  } as CSSProperties;

  return (
    <section className={`story-section${stageProfileClass} ${active ? "is-active" : ""}`} data-scene={scene.id} id={scene.id} style={style}>
      <div className="story-copy">
        <p className="scene-count">{String(scene.order).padStart(2, "0")}</p>
        <h2>{scene.title}</h2>
        <p className="period">{scene.period}</p>
        <p className="sentence">{scene.copy}</p>
      </div>

      <figure className="photo-stack" aria-label={`${scene.title}主照片`}>
        <span className="photo-shadow photo-shadow-one" />
        <span className="photo-shadow photo-shadow-two" />
        <img src={scene.mainPhoto} alt={`${scene.title}主照片`} loading="lazy" decoding="async" />
      </figure>
    </section>
  );
}
