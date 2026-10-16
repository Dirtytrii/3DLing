import { useEffect, useRef } from "react";
import * as THREE from "three";
import { scenes, type DreamScene } from "../data/dreamScenes";
import { coverPoint } from "../lib/cover";
import { loadImage } from "../lib/resources";

interface StageProps { scene: DreamScene; active: boolean; reducedMotion: boolean }
interface Props extends StageProps { prepare: boolean; onPrepared: (count: number) => void; onPrepareError: () => void }
interface SpriteAsset { texture: THREE.Texture; aspect: number; top: number; bottom: number; center: number }
interface Layer { group: THREE.Group; doll: THREE.Mesh; shadow: THREE.Mesh; scene: DreamScene; asset: SpriteAsset; opacity: number }

function inspectAlpha(image: HTMLImageElement): Omit<SpriteAsset, "texture"> {
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 256 / Math.max(image.width, image.height));
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let left = canvas.width, right = 0, top = canvas.height, bottom = 0;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (pixels[(y * canvas.width + x) * 4 + 3] < 60) continue;
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y + 1);
    }
  }
  return { aspect: image.width / image.height, top: top / canvas.height, bottom: bottom / canvas.height, center: (left + right) / (2 * canvas.width) };
}

/** One screen-space canvas; art and original toy pixels use identical cover math. */
export function DreamStageCanvas({ scene, active, reducedMotion, prepare, onPrepared, onPrepareError }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const engine = useRef<{ update: (props: StageProps) => void; prepare: (report: (count: number) => void) => Promise<void> } | null>(null);

  useEffect(() => {
    const element = host.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "default" }); }
    catch { element.dataset.modelState = "unavailable"; return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    element.appendChild(renderer.domElement);
    const world = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 100);
    camera.position.z = 10;
    const cache = new Map<string, Promise<SpriteAsset>>();
    const textures = new Set<THREE.Texture>();
    let warmMaterial: THREE.MeshBasicMaterial | null = null;
    let layers: Layer[] = [];
    let current: StageProps | null = null;
    let disposed = false, sequence = 0, frame = 0, started = 0, duration = 800;
    let width = 1, height = 1;
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128; shadowCanvas.height = 64;
    const context = shadowCanvas.getContext("2d")!;
    const gradient = context.createRadialGradient(64, 32, 0, 64, 32, 64);
    gradient.addColorStop(0, "rgba(25,12,30,.55)"); gradient.addColorStop(1, "rgba(25,12,30,0)");
    context.fillStyle = gradient; context.fillRect(0, 0, 128, 64);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);

    const place = (layer: Layer) => {
      const point = coverPoint(width, height, layer.scene.art.aspect, ...layer.scene.art.foot);
      const visibleHeight = layer.scene.art.toyHeight * point.artHeight;
      const rawHeight = visibleHeight / Math.max(0.1, layer.asset.bottom - layer.asset.top);
      const rawWidth = rawHeight * layer.asset.aspect;
      layer.doll.scale.set(rawWidth, rawHeight, 1);
      layer.doll.position.set(point.x + rawWidth * (0.5 - layer.asset.center), height - point.y + rawHeight * (layer.asset.bottom - 0.5), 2);
      layer.shadow.scale.set(visibleHeight * 0.34, Math.max(10, visibleHeight * 0.035), 1);
      layer.shadow.position.set(point.x, height - point.y + 1, 1);
      if (layer === layers[layers.length - 1]) {
        element.dataset.toyFootX = point.x.toFixed(1);
        element.dataset.toyFootY = point.y.toFixed(1);
      }
    };
    const opacity = (layer: Layer, value: number) => {
      (layer.doll.material as THREE.MeshBasicMaterial).opacity = value;
      (layer.shadow.material as THREE.MeshBasicMaterial).opacity = value * 0.7;
    };
    const release = (layer: Layer) => {
      world.remove(layer.group);
      [layer.doll, layer.shadow].forEach((mesh) => { mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose(); });
    };
    const render = () => {
      if (!current?.active || document.hidden || disposed) return;
      renderer.render(world, camera);
    };
    const animate = (now: number) => {
      frame = 0;
      if (disposed || !current?.active || document.hidden) return;
      const progress = Math.min(1, (now - started) / Math.max(1, duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      layers.forEach((layer, index) => opacity(layer, index === layers.length - 1 ? eased : layer.opacity * (1 - eased)));
      render();
      if (progress < 1) frame = requestAnimationFrame(animate);
      else {
        layers.slice(0, -1).forEach(release);
        layers = layers.slice(-1);
        if (layers[0]) layers[0].opacity = 1;
        element.dataset.spriteTransition = "settled";
        element.dataset.spriteLoaded = "true";
      }
    };
    const start = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(animate); };
    const load = (src: string) => {
      if (!cache.has(src)) cache.set(src, loadImage(src).then((image) => {
        if (disposed) throw new Error("Stage disposed");
        const texture = new THREE.Texture(image);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        textures.add(texture);
        return { texture, ...inspectAlpha(image) };
      }).catch((error) => { cache.delete(src); throw error; }));
      return cache.get(src)!;
    };
    const resize = () => {
      width = element.clientWidth || 1; height = element.clientHeight || 1;
      renderer.setSize(width, height);
      camera.right = width; camera.top = height; camera.updateProjectionMatrix();
      layers.forEach(place); render();
    };
    engine.current = { prepare: async (report) => {
      renderer.initTexture(shadowTexture);
      let count = 0;
      for (const item of scenes) {
        const asset = await load(item.toyDisplay!.imagePath);
        if (disposed) return;
        renderer.initTexture(asset.texture);
        if (count === 0) {
          const warmScene = new THREE.Scene();
          warmMaterial = new THREE.MeshBasicMaterial({ map: asset.texture, transparent: true, alphaTest: 0.04, depthWrite: false, depthTest: false, toneMapped: false });
          const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), warmMaterial);
          warmScene.add(mesh); renderer.compile(warmScene, camera);
          mesh.geometry.dispose();
        }
        element.dataset.preparedTextures = String(++count);
        report(count);
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
    }, update: (props) => {
      const changed = current?.scene.id !== props.scene.id;
      current = props;
      element.dataset.stageActive = String(props.active);
      if (!props.active) { cancelAnimationFrame(frame); frame = 0; return; }
      const existing = layers[layers.length - 1];
      if (!changed && existing?.scene.id === props.scene.id) {
        resize();
        if (props.reducedMotion) { started = 0; duration = 1; }
        if (element.dataset.spriteTransition === "transitioning") start();
        return;
      }
      const display = props.scene.toyDisplay;
      const unavailable = () => {
        layers.forEach(release); layers = [];
        element.dataset.modelState = "unavailable";
        element.dataset.spriteLoaded = "false";
        element.dataset.spriteTransition = "settled";
        renderer.clear();
      };
      if (!display || display.assetReady === false) { sequence++; unavailable(); return; }
      const token = ++sequence;
      element.dataset.spriteLoaded = "false";
      element.dataset.spriteTransition = "transitioning";
      element.dataset.stageProfile = props.scene.stage.profile ?? "default";
      void load(display.imagePath).then((asset) => {
        if (disposed || sequence !== token || current?.scene.id !== props.scene.id) return;
        layers.forEach((layer) => { layer.opacity = (layer.doll.material as THREE.MeshBasicMaterial).opacity; });
        const group = new THREE.Group();
        const doll = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: asset.texture, transparent: true, opacity: 0, alphaTest: 0.04, depthWrite: false, depthTest: false, toneMapped: false }));
        const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, opacity: 0, depthWrite: false, depthTest: false }));
        doll.renderOrder = 2; shadow.renderOrder = 1;
        group.add(shadow, doll); world.add(group);
        layers.push({ group, doll, shadow, scene: props.scene, asset, opacity: 0 });
        resize();
        element.dataset.modelState = "sprite";
        element.dataset.spriteAsset = display.imagePath;
        element.dataset.spriteScene = props.scene.id;
        element.dataset.stageProfile = props.scene.stage.profile ?? "default";
        started = performance.now(); duration = props.reducedMotion ? 1 : 800; start();
      }).catch(() => {
        if (!disposed && sequence === token) unavailable();
      });
    } };
    const observer = new ResizeObserver(resize); observer.observe(element); resize();
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else if (element.dataset.spriteTransition === "transitioning") start(); else render(); };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      disposed = true; sequence++; engine.current = null; cancelAnimationFrame(frame);
      observer.disconnect(); document.removeEventListener("visibilitychange", visibility);
      layers.forEach(release); textures.forEach((texture) => texture.dispose()); warmMaterial?.dispose(); shadowTexture.dispose(); renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => { engine.current?.update({ scene, active, reducedMotion }); }, [scene, active, reducedMotion]);
  useEffect(() => {
    if (!prepare) return;
    if (!engine.current) { onPrepareError(); return; }
    let cancelled = false;
    void engine.current.prepare((count) => { if (!cancelled) onPrepared(count); }).catch(() => { if (!cancelled) onPrepareError(); });
    return () => { cancelled = true; };
  }, [prepare, onPrepared, onPrepareError]);
  return <div ref={host} className={`stage-canvas ${active ? "is-visible" : ""}`} aria-hidden="true" />;
}
