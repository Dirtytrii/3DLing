import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { StoryScene } from "../data/scenes";

interface SceneBackgroundProps {
  scene: StoryScene;
}

type BackgroundLayer = {
  key: string;
  sceneId: string;
  profile: string;
  imagePath?: string;
  position: string;
  mobilePosition: string;
  opacity: number;
  maskLeft: number;
  maskMid: number;
  maskRight: number;
  accent: string;
  floor: string;
  state: "active" | "exiting";
};

const CROSSFADE_MS = 900;

const toLayer = (scene: StoryScene): BackgroundLayer => ({
  key: `${scene.id}:${scene.backgroundAsset?.imagePath ?? "ambient"}`,
  sceneId: scene.id,
  profile: scene.stage.profile ?? "ambient",
  imagePath: scene.backgroundAsset?.imagePath,
  position: scene.backgroundAsset?.position ?? "center center",
  mobilePosition: scene.backgroundAsset?.mobilePosition ?? scene.backgroundAsset?.position ?? "center center",
  opacity: scene.backgroundAsset?.opacity ?? 0,
  maskLeft: scene.backgroundAsset?.mask?.left ?? 0.48,
  maskMid: scene.backgroundAsset?.mask?.mid ?? 0.08,
  maskRight: scene.backgroundAsset?.mask?.right ?? 0.18,
  accent: scene.stage.accent,
  floor: scene.stage.floor,
  state: "active"
});

export function SceneBackground({ scene }: SceneBackgroundProps) {
  const nextLayer = useMemo(() => toLayer(scene), [scene]);
  const [layers, setLayers] = useState<BackgroundLayer[]>([nextLayer]);

  useEffect(() => {
    let cancelled = false;
    let cleanupTimer = 0;

    const activateLayer = () => {
      if (cancelled) return;

      setLayers((currentLayers) => {
        const active = currentLayers.find((layer) => layer.state === "active") ?? currentLayers[currentLayers.length - 1];
        if (active?.key === nextLayer.key) return [{ ...nextLayer, state: "active" }];
        return active ? [{ ...active, state: "exiting" }, { ...nextLayer, state: "active" }] : [{ ...nextLayer, state: "active" }];
      });

      cleanupTimer = window.setTimeout(() => {
        setLayers((currentLayers) => currentLayers.filter((layer) => layer.state === "active"));
      }, CROSSFADE_MS);
    };

    if (nextLayer.imagePath) {
      const image = new Image();
      image.decoding = "async";
      image.onload = activateLayer;
      image.onerror = activateLayer;
      image.src = nextLayer.imagePath;
      if (image.complete) activateLayer();
    } else {
      activateLayer();
    }

    return () => {
      cancelled = true;
      window.clearTimeout(cleanupTimer);
    };
  }, [nextLayer]);

  return (
    <div className="scene-background" aria-hidden="true">
      {layers.map((layer) => {
        const style = {
          "--scene-bg-image": layer.imagePath ? `url("${layer.imagePath}")` : "none",
          "--scene-bg-position": layer.position,
          "--scene-bg-mobile-position": layer.mobilePosition,
          "--scene-bg-opacity": layer.opacity,
          "--scene-bg-mask-left": layer.maskLeft,
          "--scene-bg-mask-mid": layer.maskMid,
          "--scene-bg-mask-right": layer.maskRight,
          "--scene-accent": layer.accent,
          "--scene-floor": layer.floor
        } as CSSProperties;

        return (
          <div
            key={`${layer.key}:${layer.state}`}
            className={`scene-background-layer stage-${layer.profile} is-${layer.state}`}
            data-background-scene={layer.sceneId}
            style={style}
          />
        );
      })}
    </div>
  );
}
