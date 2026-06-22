import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { StoryScene } from "../data/scenes";

interface StorySectionProps {
  scene: StoryScene;
  active: boolean;
}

export function StorySection({ scene, active }: StorySectionProps) {
  const [selectedPhoto, setSelectedPhoto] = useState(scene.mainPhoto);
  const stageProfileClass = scene.stage.profile ? ` stage-${scene.stage.profile}` : "";
  const gallery = useMemo(() => Array.from(new Set([scene.mainPhoto, ...(scene.photoStack ?? [])])), [scene.mainPhoto, scene.photoStack]);
  const visibleBackCards = gallery.filter((photo) => photo !== selectedPhoto).slice(0, 2);
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

  useEffect(() => {
    setSelectedPhoto(scene.mainPhoto);
  }, [scene.id, scene.mainPhoto]);

  return (
    <section className={`story-section${stageProfileClass} ${active ? "is-active" : ""}`} data-scene={scene.id} id={scene.id} style={style}>
      <div className="story-copy">
        <p className="scene-count">{String(scene.order).padStart(2, "0")}</p>
        <h2>{scene.title}</h2>
        <p className="period">{scene.period}</p>
        <p className="sentence">{scene.copy}</p>
      </div>

      <figure className="photo-stack" aria-label={`${scene.title}照片`}>
        {visibleBackCards.map((photo, index) => (
          <button
            aria-label={`切换到${scene.title}照片 ${gallery.indexOf(photo) + 1}`}
            className={`photo-card photo-card-back photo-shadow-${index === 0 ? "one" : "two"}`}
            data-photo-card="back"
            data-photo-src={photo}
            key={photo}
            onClick={() => setSelectedPhoto(photo)}
            type="button"
          >
            <img src={photo} alt={`${scene.title}照片 ${gallery.indexOf(photo) + 1}`} loading="lazy" decoding="async" />
          </button>
        ))}
        <img
          key={selectedPhoto}
          className="photo-main-image"
          data-photo-main="true"
          src={selectedPhoto}
          alt={`${scene.title}主照片`}
          loading="lazy"
          decoding="async"
        />
      </figure>
    </section>
  );
}
