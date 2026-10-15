import { useMemo, useState } from "react";
import type { DreamScene } from "../data/dreamScenes";
import { ArrowIcon } from "./ArrowIcon";

export function StorySection({ scene, active, previous, next, last }: { scene: DreamScene; active: boolean; previous: string; next: string; last: boolean }) {
  const gallery = useMemo(() => Array.from(new Set([scene.mainPhoto, ...(scene.photoStack ?? [])])), [scene.mainPhoto, scene.photoStack]);
  const [selected, setSelected] = useState(0);
  const backs = gallery.filter((_, index) => index !== selected).slice(0, 2);
  const select = (step: number) => setSelected((index) => (index + step + gallery.length) % gallery.length);
  return (
    <section className={`story-section ${active ? "is-active" : ""}`} data-scene={scene.id} data-section={scene.id} id={scene.id}>
      <div className="memory-content">
        <div className="story-copy"><h2>{scene.title}</h2><p className="period">{scene.period}</p><p className="sentence">{scene.copy}</p></div>
        <figure className="photo-stack" aria-label={`${scene.title}照片`}>
          <div className="photo-mat">
          {backs.map((photo, index) => <span key={photo} className={`photo-back photo-back-${index + 1}`} aria-hidden="true"><img src={photo} alt="" loading="lazy" decoding="async" /></span>)}
          <img key={gallery[selected]} className="photo-main-image" data-photo-main="true" src={gallery[selected]} alt={`${scene.title}主照片`} loading="lazy" decoding="async" />
          </div>
          {gallery.length > 1 && <figcaption className="photo-controls"><button type="button" onClick={() => select(-1)} aria-label={`查看${scene.title}上一张照片`}><ArrowIcon direction="left" /></button><span aria-live="polite">{selected + 1} / {gallery.length}</span><button type="button" onClick={() => select(1)} aria-label={`查看${scene.title}下一张照片`}><ArrowIcon /></button></figcaption>}
        </figure>
      </div>
      <div className="section-pager memory-pager"><div className="memory-progress"><a className="text-link" href={`#${previous}`}><ArrowIcon direction="left" /><span>上一幕</span></a><span>{String(scene.order).padStart(2, "0")} / 06 · {scene.title}</span></div><a className="text-link" href={`#${next}`}>{last ? "去许个愿" : "下一幕"}<ArrowIcon /></a></div>
    </section>
  );
}
