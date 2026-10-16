import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { DreamScene } from "../data/dreamScenes";

interface Layer { key: number; scene: DreamScene; state: "active" | "entering" | "exiting" }
const CROSSFADE_MS = 800;

/** All plates are decoded by the boot gate. Stable keys preserve outgoing pixels. */
export function SceneBackground({ scene }: { scene: DreamScene }) {
  const [layers, setLayers] = useState<Layer[]>([{ key: 0, scene, state: "active" }]);
  const selected = useRef(scene.id);
  const sequence = useRef(0);
  useLayoutEffect(() => {
    if (selected.current === scene.id) return;
    selected.current = scene.id;
    const key = ++sequence.current;
    // A rapid return can select an image still serving as the opaque base. Keep
    // that instance underneath and fade in a distinct layer with stable identity.
    setLayers((current) => [...current.map((layer) => ({ ...layer, state: "exiting" as const })), { key, scene, state: "entering" }]);
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        setLayers((current) => current.map((layer) => ({ ...layer, state: layer.key === key ? "active" : "exiting" })));
      });
    });
    const timer = window.setTimeout(() => setLayers((current) => current.filter((layer) => layer.key === key)), CROSSFADE_MS + 80);
    return () => { cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame); window.clearTimeout(timer); };
  }, [scene]);
  return <div className="scene-background" aria-hidden="true">{layers.map((layer) => <div
    key={layer.key}
    className={`scene-background-layer is-${layer.state}`}
    data-background-scene={layer.scene.id}
    style={{ "--scene-bg-image": `url("${layer.scene.art.src}")` } as CSSProperties}
  />)}</div>;
}
