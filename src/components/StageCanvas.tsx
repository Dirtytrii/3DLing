import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { StoryScene } from "../data/scenes";

interface StageCanvasProps {
  scene: StoryScene;
}

type ToyParts = {
  group: THREE.Group;
  placeholder: THREE.Group;
  modelSlot: THREE.Group;
  materials: THREE.MeshStandardMaterial[];
  belt: THREE.MeshStandardMaterial;
  outfit: THREE.MeshStandardMaterial;
  hair: THREE.MeshStandardMaterial;
  skin: THREE.MeshStandardMaterial;
};

const makeMat = (color: string, options: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.06,
    ...options
  });

const isRedWheatConcert = (scene: StoryScene) => scene.stage.profile === "red-wheat-concert";

type StageAnchor = {
  toyBaseY: number;
  placeholderBaseLift: number;
  spriteScale: number;
  spriteXOffset: number;
  spriteYOffset: number;
  spriteTargetScale: number;
  placeholderTargetScale: number;
  spriteEntryScale: number;
  placeholderEntryScale: number;
};

const STAGE_ANCHORS = {
  desktop: {
    toyBaseY: -0.34,
    placeholderBaseLift: 0.1,
    spriteScale: 1,
    spriteXOffset: 0,
    spriteYOffset: 0,
    spriteTargetScale: 1,
    placeholderTargetScale: 0.88,
    spriteEntryScale: 0.92,
    placeholderEntryScale: 0.74
  },
  narrow: {
    toyBaseY: -0.3,
    placeholderBaseLift: 0.15,
    spriteScale: 0.58,
    spriteXOffset: 0.26,
    spriteYOffset: 1.1,
    spriteTargetScale: 0.98,
    placeholderTargetScale: 0.78,
    spriteEntryScale: 0.9,
    placeholderEntryScale: 0.68
  }
} satisfies Record<string, StageAnchor>;

const getStageAnchor = (width: number): StageAnchor => (width < 600 ? STAGE_ANCHORS.narrow : STAGE_ANCHORS.desktop);

type SpriteDisplay = NonNullable<StoryScene["toyDisplay"]>;
type SpritePosition = [number, number, number];

const DEFAULT_SPRITE_POSITION: SpritePosition = [0, 0.18, 0.08];
const DEFAULT_SPRITE_FILL_LIGHT = {
  color: "#fff0d6",
  opacity: 0.16,
  scale: 1.002
};

const lerp = (start: number, end: number, amount: number) => start + (end - start) * amount;

const interpolateSpritePosition = (stops: NonNullable<SpriteDisplay["responsivePositions"]>, aspect: number): SpritePosition => {
  const sorted = [...stops].sort((a, b) => a.aspect - b.aspect);
  if (aspect <= sorted[0].aspect) return sorted[0].position;

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const next = sorted[index];
    if (aspect <= next.aspect) {
      const amount = (aspect - previous.aspect) / (next.aspect - previous.aspect);
      return [
        lerp(previous.position[0], next.position[0], amount),
        lerp(previous.position[1], next.position[1], amount),
        lerp(previous.position[2], next.position[2], amount)
      ];
    }
  }

  return sorted[sorted.length - 1].position;
};

const resolveSpritePosition = (display: SpriteDisplay, viewportWidth: number, viewportHeight: number): SpritePosition => {
  if (viewportWidth < 600 && display.mobilePosition) return display.mobilePosition;
  if (display.responsivePositions?.length) {
    return interpolateSpritePosition(display.responsivePositions, viewportWidth / Math.max(viewportHeight, 1));
  }
  return display.position ?? DEFAULT_SPRITE_POSITION;
};

function createToy(): ToyParts {
  const group = new THREE.Group();
  group.position.set(0.72, STAGE_ANCHORS.desktop.toyBaseY + STAGE_ANCHORS.desktop.placeholderBaseLift, 0);
  group.rotation.y = -0.18;

  const placeholder = new THREE.Group();
  const modelSlot = new THREE.Group();
  group.add(placeholder, modelSlot);

  const skin = makeMat("#f4c9a8", { roughness: 0.72 });
  const hair = makeMat("#151111", { roughness: 0.44 });
  const outfit = makeMat("#101012", { roughness: 0.36 });
  const belt = makeMat("#b87333", { roughness: 0.28, metalness: 0.65 });
  const boots = makeMat("#08080a", { roughness: 0.32 });
  const blush = makeMat("#f28e96", { roughness: 0.7 });
  const eye = makeMat("#120d0e", { roughness: 0.18 });
  const sparkle = makeMat("#f9ece1", { roughness: 0.12, metalness: 0.2, emissive: "#ffe1bc", emissiveIntensity: 0.25 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 48, 32), skin);
  head.position.set(0, 1.12, 0);
  head.scale.set(1.02, 1.05, 0.92);
  placeholder.add(head);

  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.39, 32, 24), hair);
  hairBack.position.set(-0.02, 1.13, -0.08);
  hairBack.scale.set(1.07, 1.1, 0.72);
  placeholder.add(hairBack);

  const bang = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 18), hair);
  bang.position.set(-0.16, 1.28, 0.17);
  bang.scale.set(1.15, 0.58, 0.38);
  bang.rotation.z = 0.4;
  placeholder.add(bang);

  for (let i = 0; i < 7; i += 1) {
    const curl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 12), hair);
    curl.position.set(-0.33 + i * 0.11, 0.88 - Math.sin(i) * 0.03, -0.02 - Math.abs(i - 3) * 0.025);
    curl.scale.set(0.85, 1.55, 0.7);
    placeholder.add(curl);
  }

  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.042, 16, 10), eye);
  leftEye.position.set(-0.11, 1.13, 0.325);
  const rightEye = leftEye.clone();
  rightEye.position.x = 0.11;
  placeholder.add(leftEye, rightEye);

  const leftBlush = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), blush);
  leftBlush.position.set(-0.18, 1.04, 0.32);
  leftBlush.scale.set(1.55, 0.58, 0.25);
  const rightBlush = leftBlush.clone();
  rightBlush.position.x = 0.18;
  placeholder.add(leftBlush, rightBlush);

  const rhinestone = new THREE.Mesh(new THREE.OctahedronGeometry(0.035), sparkle);
  rhinestone.position.set(0.19, 1.24, 0.31);
  placeholder.add(rhinestone);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.23, 0.46, 32), outfit);
  body.position.set(0, 0.62, 0);
  placeholder.add(body);

  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.22, 32), outfit);
  skirt.position.set(0, 0.33, 0);
  placeholder.add(skirt);

  const neckRibbon = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.01, 8, 24), belt);
  neckRibbon.position.set(0, 0.81, 0.215);
  neckRibbon.rotation.x = Math.PI / 2;
  placeholder.add(neckRibbon);

  const beltRing = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.017, 8, 36), belt);
  beltRing.position.set(0, 0.43, 0.05);
  beltRing.rotation.x = Math.PI / 2;
  placeholder.add(beltRing);

  for (let i = 0; i < 7; i += 1) {
    const medal = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.007, 8, 16), belt);
    medal.position.set(-0.21 + i * 0.07, 0.43 - Math.abs(i - 3) * 0.005, 0.245);
    medal.rotation.x = Math.PI / 2;
    placeholder.add(medal);
  }

  const armGeo = new THREE.CylinderGeometry(0.045, 0.042, 0.46, 16);
  const leftArm = new THREE.Mesh(armGeo, skin);
  leftArm.position.set(-0.27, 0.58, 0.02);
  leftArm.rotation.z = -0.35;
  const rightArm = new THREE.Mesh(armGeo, skin);
  rightArm.position.set(0.27, 0.58, 0.02);
  rightArm.rotation.z = 0.35;
  placeholder.add(leftArm, rightArm);

  const legGeo = new THREE.CylinderGeometry(0.05, 0.055, 0.42, 16);
  const leftLeg = new THREE.Mesh(legGeo, skin);
  leftLeg.position.set(-0.1, 0.02, 0);
  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.1;
  placeholder.add(leftLeg, rightLeg);

  const bootGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.19, 16);
  const leftBoot = new THREE.Mesh(bootGeo, boots);
  leftBoot.position.set(-0.1, -0.25, 0);
  const rightBoot = leftBoot.clone();
  rightBoot.position.x = 0.1;
  placeholder.add(leftBoot, rightBoot);

  const bag = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), boots);
  bag.position.set(-0.42, 0.34, 0.13);
  bag.scale.set(0.86, 0.64, 0.32);
  const bagHandle = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.006, 8, 24), belt);
  bagHandle.position.set(-0.42, 0.46, 0.13);
  bagHandle.rotation.x = Math.PI / 2;
  placeholder.add(bag, bagHandle);

  const suitcase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.14), makeMat("#e8d4bb", { roughness: 0.34, metalness: 0.18 }));
  suitcase.position.set(0.52, -0.18, 0.08);
  const suitcaseHandle = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.008, 8, 24), belt);
  suitcaseHandle.position.set(0.52, 0.02, 0.08);
  suitcaseHandle.scale.y = 0.62;
  placeholder.add(suitcase, suitcaseHandle);

  const ticket = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.01), makeMat("#1d1110", { emissive: "#401713", emissiveIntensity: 0.35 }));
  ticket.position.set(0.7, -0.34, 0.2);
  ticket.rotation.set(-0.5, 0.1, -0.22);
  placeholder.add(ticket);

  return {
    group,
    placeholder,
    modelSlot,
    materials: [skin, hair, outfit, belt, boots, blush, eye, sparkle],
    belt,
    outfit,
    hair,
    skin
  };
}

function createWheatField(accent: string, profile?: StoryScene["stage"]["profile"]) {
  const field = new THREE.Group();
  const concert = profile === "red-wheat-concert";
  const wheatMat = makeMat(concert ? "#bd633f" : "#c9964f", {
    roughness: 0.82,
    emissive: concert ? "#8f1e18" : accent,
    emissiveIntensity: concert ? 0.32 : 0.08
  });
  const headMat = makeMat(concert ? "#f0a85a" : "#f4c66c", {
    roughness: 0.86,
    emissive: concert ? "#9c261d" : accent,
    emissiveIntensity: concert ? 0.26 : 0.06
  });

  const count = concert ? 560 : 180;
  let placed = 0;
  for (let i = 0; placed < count && i < count * 5; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const radius = (concert ? 0.92 : 1.28) + Math.random() * (concert ? 1.72 : 1.15);
    const x = Math.cos(angle) * radius + (Math.random() - 0.5) * (concert ? 0.5 : 0.28);
    const z = Math.sin(angle) * radius * (concert ? 0.5 : 0.52) - 0.2 + (Math.random() - 0.5) * (concert ? 0.46 : 0.26);
    const clearPlatform = concert && ((x - 0.46) / 1.18) ** 2 + ((z - 0.02) / 0.62) ** 2 < 1;
    if (clearPlatform) continue;
    const frontSoftener = concert && z > 0.24 ? 0.64 : 1;
    const height = ((concert ? 0.42 : 0.34) + Math.random() * (concert ? 0.36 : 0.28)) * frontSoftener;
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.009, height, 5), wheatMat);
    stalk.position.set(x, -0.78 + height / 2, z);
    stalk.rotation.z = (Math.random() - 0.5) * 0.22;
    const head = new THREE.Mesh(new THREE.ConeGeometry(concert ? 0.032 : 0.025, concert ? 0.12 : 0.09, 5), headMat);
    head.position.set(x, -0.78 + height + 0.04, z);
    head.rotation.z = stalk.rotation.z;
    field.add(stalk, head);
    placed += 1;
  }

  if (concert) {
    [
      { width: 4.9, height: 1.08, x: -0.22, y: -0.44, z: -0.68, opacity: 0.78, color: "#d96a43" },
      { width: 4.4, height: 0.82, x: 0.52, y: -0.54, z: -0.28, opacity: 0.54, color: "#ff7c4b" },
      { width: 3.7, height: 0.66, x: -0.9, y: -0.62, z: 0.12, opacity: 0.34, color: "#b43a2c" }
    ].forEach((layer, index) => {
      const veil = new THREE.Mesh(
        new THREE.PlaneGeometry(layer.width, layer.height),
        new THREE.MeshBasicMaterial({
          map: createWheatVeilTexture(index),
          color: layer.color,
          transparent: true,
          opacity: layer.opacity,
          depthWrite: false,
          depthTest: true,
          side: THREE.DoubleSide
        })
      );
      veil.position.set(layer.x, layer.y, layer.z);
      veil.renderOrder = index;
      field.add(veil);
    });
  }

  return field;
}

function createLightRing(accent: string, profile?: StoryScene["stage"]["profile"]) {
  const ring = new THREE.Group();
  const concert = profile === "red-wheat-concert";
  const lampColor = concert ? "#ff7b45" : accent;
  const lampMat = makeMat(lampColor, { emissive: lampColor, emissiveIntensity: concert ? 3.6 : 1.7, roughness: 0.18 });
  const glowTexture = concert ? createLampGlowTexture() : null;
  const count = concert ? 0 : 16;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(concert ? 0.076 : 0.055, concert ? 0.09 : 0.065, 0.025, 24), lampMat);
    lamp.position.set(Math.cos(angle) * (concert ? 1.38 : 1.1), -0.61, Math.sin(angle) * (concert ? 0.84 : 0.74));
    lamp.rotation.x = Math.PI / 2;
    lamp.renderOrder = 5;
    ring.add(lamp);
  }
  if (concert) {
    for (let i = 0; i < 11; i += 1) {
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.1, 0.028, 24), lampMat);
      const x = -1.54 + i * 0.31;
      const z = 0.78 + Math.sin(i) * 0.035;
      lamp.position.set(x, -0.515, z);
      lamp.rotation.x = Math.PI / 2;
      lamp.renderOrder = 6;

      const bulbGlow = new THREE.Mesh(
        new THREE.PlaneGeometry(0.32, 0.16),
        new THREE.MeshBasicMaterial({
          map: glowTexture,
          color: "#ff7848",
          transparent: true,
          opacity: 0.92,
          depthWrite: false,
          depthTest: false,
          blending: THREE.AdditiveBlending
        })
      );
      bulbGlow.position.set(x, -0.502, z + 0.01);
      bulbGlow.rotation.x = -Math.PI / 2;
      bulbGlow.renderOrder = 8;

      const reflection = new THREE.Mesh(
        new THREE.PlaneGeometry(0.42, 0.28),
        new THREE.MeshBasicMaterial({
          map: glowTexture,
          color: "#ff6d3d",
          transparent: true,
          opacity: 0.32,
          depthWrite: false,
          depthTest: false,
          blending: THREE.AdditiveBlending
        })
      );
      reflection.position.set(x, -0.602, z - 0.18);
      reflection.rotation.x = -Math.PI / 2;
      reflection.scale.set(1.15, 0.58, 1);
      reflection.renderOrder = 4;
      ring.add(lamp, bulbGlow, reflection);
    }
  }
  return ring;
}

const createCanvasTexture = (width: number, height: number, draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const createSpriteKeyLightTexture = () =>
  createCanvasTexture(512, 768, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.filter = "blur(16px)";
    const overhead = ctx.createRadialGradient(width * 0.53, height * 0.08, 2, width * 0.53, height * 0.08, width * 0.34);
    overhead.addColorStop(0, "rgba(224, 240, 255, 0.62)");
    overhead.addColorStop(0.42, "rgba(185, 218, 255, 0.26)");
    overhead.addColorStop(1, "rgba(185, 218, 255, 0)");
    ctx.fillStyle = overhead;
    ctx.fillRect(0, 0, width, height * 0.42);
    ctx.restore();

    const crownGlow = ctx.createRadialGradient(width * 0.53, height * 0.13, 2, width * 0.53, height * 0.13, width * 0.22);
    crownGlow.addColorStop(0, "rgba(226, 242, 255, 0.58)");
    crownGlow.addColorStop(0.4, "rgba(195, 225, 255, 0.24)");
    crownGlow.addColorStop(1, "rgba(195, 225, 255, 0)");
    ctx.fillStyle = crownGlow;
    ctx.fillRect(0, 0, width, height * 0.34);

    const faceGlow = ctx.createRadialGradient(width * 0.53, height * 0.22, 4, width * 0.53, height * 0.22, width * 0.28);
    faceGlow.addColorStop(0, "rgba(218, 238, 255, 0.9)");
    faceGlow.addColorStop(0.34, "rgba(190, 224, 255, 0.42)");
    faceGlow.addColorStop(1, "rgba(188, 220, 255, 0)");
    ctx.fillStyle = faceGlow;
    ctx.fillRect(0, 0, width, height);

    const shoulderGlow = ctx.createRadialGradient(width * 0.53, height * 0.36, 8, width * 0.53, height * 0.36, width * 0.3);
    shoulderGlow.addColorStop(0, "rgba(225, 238, 255, 0.28)");
    shoulderGlow.addColorStop(0.46, "rgba(190, 218, 255, 0.12)");
    shoulderGlow.addColorStop(1, "rgba(190, 218, 255, 0)");
    ctx.fillStyle = shoulderGlow;
    ctx.fillRect(0, 0, width, height);

    const bodyGlow = ctx.createRadialGradient(width * 0.52, height * 0.45, 8, width * 0.52, height * 0.45, width * 0.34);
    bodyGlow.addColorStop(0, "rgba(255, 235, 210, 0.18)");
    bodyGlow.addColorStop(0.48, "rgba(255, 218, 188, 0.08)");
    bodyGlow.addColorStop(1, "rgba(255, 218, 188, 0)");
    ctx.fillStyle = bodyGlow;
    ctx.fillRect(0, 0, width, height);
  });

const createConeTexture = () =>
  createCanvasTexture(512, 1024, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.filter = "blur(18px)";
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(214, 234, 255, 0.62)");
    gradient.addColorStop(0.46, "rgba(170, 205, 255, 0.22)");
    gradient.addColorStop(1, "rgba(160, 198, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(width * 0.5, 0);
    ctx.lineTo(width * 0.96, height);
    ctx.lineTo(width * 0.04, height);
    ctx.closePath();
    ctx.fill();
    ctx.filter = "none";
  });

const createRadialFogTexture = () =>
  createCanvasTexture(512, 256, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createRadialGradient(width * 0.5, height * 0.58, 4, width * 0.5, height * 0.58, width * 0.54);
    gradient.addColorStop(0, "rgba(255, 98, 70, 0.42)");
    gradient.addColorStop(0.4, "rgba(204, 38, 33, 0.18)");
    gradient.addColorStop(1, "rgba(204, 38, 33, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  });

const createConcertHazeTexture = () =>
  createCanvasTexture(1024, 384, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    const base = ctx.createLinearGradient(0, 0, width, 0);
    base.addColorStop(0, "rgba(200, 28, 25, 0)");
    base.addColorStop(0.18, "rgba(210, 45, 34, 0.2)");
    base.addColorStop(0.44, "rgba(255, 93, 58, 0.36)");
    base.addColorStop(0.72, "rgba(170, 28, 25, 0.22)");
    base.addColorStop(1, "rgba(180, 28, 28, 0)");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 18; i += 1) {
      const x = width * (0.08 + Math.random() * 0.84);
      const y = height * (0.36 + Math.random() * 0.4);
      const radius = width * (0.08 + Math.random() * 0.12);
      const puff = ctx.createRadialGradient(x, y, 0, x, y, radius);
      puff.addColorStop(0, "rgba(255, 135, 92, 0.2)");
      puff.addColorStop(0.55, "rgba(190, 38, 33, 0.12)");
      puff.addColorStop(1, "rgba(190, 38, 33, 0)");
      ctx.fillStyle = puff;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
  });

const createPlatformTexture = () =>
  createCanvasTexture(1024, 1024, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const floor = ctx.createRadialGradient(centerX, centerY, width * 0.08, centerX, centerY, width * 0.52);
    floor.addColorStop(0, "rgba(255, 210, 150, 0.22)");
    floor.addColorStop(0.38, "rgba(128, 47, 28, 0.24)");
    floor.addColorStop(0.74, "rgba(40, 15, 13, 0.88)");
    floor.addColorStop(1, "rgba(16, 7, 7, 0.96)");
    ctx.fillStyle = floor;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(255, 168, 94, 0.32)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 18; i += 1) {
      const y = height * (0.18 + i * 0.038);
      ctx.beginPath();
      ctx.moveTo(width * 0.12, y);
      ctx.bezierCurveTo(width * 0.32, y + Math.sin(i) * 18, width * 0.7, y - Math.cos(i) * 14, width * 0.9, y + Math.sin(i * 1.7) * 12);
      ctx.stroke();
    }

    const shine = ctx.createLinearGradient(width * 0.18, height * 0.74, width * 0.86, height * 0.44);
    shine.addColorStop(0, "rgba(255, 216, 170, 0)");
    shine.addColorStop(0.42, "rgba(255, 209, 158, 0.2)");
    shine.addColorStop(0.55, "rgba(255, 238, 214, 0.33)");
    shine.addColorStop(0.72, "rgba(255, 144, 78, 0.12)");
    shine.addColorStop(1, "rgba(255, 144, 78, 0)");
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, width, height);
  });

const createLampGlowTexture = () =>
  createCanvasTexture(256, 128, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(width * 0.5, height * 0.5, 2, width * 0.5, height * 0.5, width * 0.44);
    glow.addColorStop(0, "rgba(255, 245, 220, 0.9)");
    glow.addColorStop(0.2, "rgba(255, 128, 64, 0.72)");
    glow.addColorStop(0.62, "rgba(255, 72, 44, 0.28)");
    glow.addColorStop(1, "rgba(255, 72, 44, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  });

const createWheatVeilTexture = (seed = 0) =>
  createCanvasTexture(1024, 320, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);

    const base = ctx.createLinearGradient(0, height, 0, 0);
    base.addColorStop(0, "rgba(255, 118, 70, 0.44)");
    base.addColorStop(0.34, "rgba(206, 62, 40, 0.28)");
    base.addColorStop(0.72, "rgba(162, 38, 30, 0.09)");
    base.addColorStop(1, "rgba(162, 38, 30, 0)");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    ctx.lineCap = "round";
    for (let i = 0; i < 220; i += 1) {
      const t = (i * 73 + seed * 97) % 997;
      const x = (t / 997) * width;
      const bend = Math.sin(i * 1.7 + seed) * 18;
      const bladeHeight = height * (0.34 + ((i * 41 + seed * 13) % 100) / 240);
      const bottom = height * (0.94 + Math.sin(i + seed) * 0.035);
      const top = Math.max(18, bottom - bladeHeight);

      ctx.strokeStyle = i % 3 === 0 ? "rgba(255, 183, 100, 0.62)" : "rgba(189, 67, 43, 0.52)";
      ctx.lineWidth = i % 5 === 0 ? 2.2 : 1.35;
      ctx.beginPath();
      ctx.moveTo(x, bottom);
      ctx.quadraticCurveTo(x + bend * 0.35, (bottom + top) * 0.58, x + bend, top);
      ctx.stroke();

      if (i % 2 === 0) {
        ctx.fillStyle = i % 4 === 0 ? "rgba(255, 180, 94, 0.66)" : "rgba(220, 100, 58, 0.58)";
        ctx.beginPath();
        ctx.ellipse(x + bend, top + 10, 3.4, 11, bend * 0.02, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });

const createLedScreenTexture = () =>
  createCanvasTexture(512, 320, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "rgba(40, 8, 10, 0.92)");
    bg.addColorStop(0.44, "rgba(185, 34, 31, 0.9)");
    bg.addColorStop(1, "rgba(18, 5, 7, 0.96)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const smoke = ctx.createRadialGradient(width * 0.48, height * 0.42, 4, width * 0.48, height * 0.42, width * 0.54);
    smoke.addColorStop(0, "rgba(255, 190, 158, 0.28)");
    smoke.addColorStop(0.38, "rgba(255, 95, 70, 0.2)");
    smoke.addColorStop(1, "rgba(255, 95, 70, 0)");
    ctx.fillStyle = smoke;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(255, 109, 74, 0.14)";
    ctx.lineWidth = 1;
    for (let y = 10; y < height; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y + Math.sin(y * 0.04) * 5);
      ctx.stroke();
    }
  });

function createRedWheatConcertFx(accent: string) {
  const group = new THREE.Group();
  const hazeTexture = createConcertHazeTexture();
  const screenTexture = createLedScreenTexture();

  const beam = new THREE.Mesh(
    new THREE.PlaneGeometry(1.62, 2.9),
    new THREE.MeshBasicMaterial({
      map: createConeTexture(),
      color: "#bcdcff",
      transparent: true,
      opacity: 0.56,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    })
  );
  beam.position.set(0.44, 0.86, -0.45);
  beam.renderOrder = 1;
  group.add(beam);

  const redFog = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 1.18),
    new THREE.MeshBasicMaterial({
      map: createRadialFogTexture(),
      color: accent,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    })
  );
  redFog.position.set(-0.52, -0.08, -0.82);
  redFog.renderOrder = 0;
  group.add(redFog);

  [
    { width: 4.6, height: 0.76, x: -0.24, y: -0.08, z: -1.04, opacity: 0.58 },
    { width: 3.8, height: 0.58, x: 0.5, y: 0.04, z: -0.72, opacity: 0.34 },
    { width: 4.9, height: 0.46, x: -0.96, y: -0.38, z: -0.34, opacity: 0.26 }
  ].forEach((layer, index) => {
    const hazeLayer = new THREE.Mesh(
      new THREE.PlaneGeometry(layer.width, layer.height),
      new THREE.MeshBasicMaterial({
        map: hazeTexture,
        color: index === 1 ? "#ff7b52" : accent,
        transparent: true,
        opacity: layer.opacity,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending
      })
    );
    hazeLayer.position.set(layer.x, layer.y, layer.z);
    hazeLayer.renderOrder = index;
    group.add(hazeLayer);
  });

  const platformSurface = new THREE.Mesh(
    new THREE.CircleGeometry(1.52, 96),
    new THREE.MeshBasicMaterial({
      map: createPlatformTexture(),
      color: "#fff1df",
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      depthTest: false
    })
  );
  platformSurface.position.set(0.46, -0.615, 0.02);
  platformSurface.rotation.x = -Math.PI / 2;
  platformSurface.scale.set(1.34, 0.59, 1);
  platformSurface.renderOrder = 2;
  group.add(platformSurface);

  const stageGlow = new THREE.Mesh(
    new THREE.CircleGeometry(1.48, 96),
    new THREE.MeshBasicMaterial({
      color: "#ff8a4e",
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    })
  );
  stageGlow.position.set(0.46, -0.592, 0.03);
  stageGlow.rotation.x = -Math.PI / 2;
  stageGlow.scale.set(1.28, 0.58, 1);
  stageGlow.renderOrder = 3;
  group.add(stageGlow);

  const stageArcPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 96; i += 1) {
    const angle = Math.PI * (0.08 + (i / 96) * 0.84);
    stageArcPoints.push(new THREE.Vector3(0.46 + Math.cos(angle) * 1.52, -0.512, Math.sin(angle) * 0.74));
  }
  const stageFrontArc = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(stageArcPoints),
    new THREE.LineBasicMaterial({
      color: "#ff8350",
      transparent: true,
      opacity: 0.66,
      depthTest: false,
      blending: THREE.AdditiveBlending
    })
  );
  stageFrontArc.renderOrder = 7;
  group.add(stageFrontArc);

  const rowMaterial = new THREE.LineBasicMaterial({ color: "#6b201e", transparent: true, opacity: 0.52 });
  const dotMaterial = new THREE.PointsMaterial({ color: "#e7d9bc", size: 0.025, transparent: true, opacity: 0.82 });
  for (let row = 0; row < 5; row += 1) {
    const points: THREE.Vector3[] = [];
    const y = 0.72 + row * 0.18;
    const z = -1.42 - row * 0.16;
    for (let i = 0; i <= 60; i += 1) {
      const t = i / 60;
      const x = -3.4 + t * 6.8;
      points.push(new THREE.Vector3(x, y + Math.sin((t - 0.5) * Math.PI) * 0.12, z));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), rowMaterial.clone()));
  }

  const stadiumBulbs = new Float32Array(54 * 3);
  for (let i = 0; i < 54; i += 1) {
    const t = i / 53;
    stadiumBulbs[i * 3] = -3.35 + t * 6.7;
    stadiumBulbs[i * 3 + 1] = 0.92 + Math.sin((t - 0.5) * Math.PI) * 0.12 + (i % 3) * 0.018;
    stadiumBulbs[i * 3 + 2] = -1.52 - Math.sin(t * Math.PI) * 0.18;
  }
  const stadiumBulbGeometry = new THREE.BufferGeometry();
  stadiumBulbGeometry.setAttribute("position", new THREE.BufferAttribute(stadiumBulbs, 3));
  group.add(
    new THREE.Points(
      stadiumBulbGeometry,
      new THREE.PointsMaterial({ color: "#ffe0b8", size: 0.036, transparent: true, opacity: 0.9 })
    )
  );

  const lightDots = new Float32Array(96 * 3);
  for (let i = 0; i < 96; i += 1) {
    lightDots[i * 3] = -3 + Math.random() * 6;
    lightDots[i * 3 + 1] = 0.34 + Math.random() * 1.08;
    lightDots[i * 3 + 2] = -1.3 - Math.random() * 1.2;
  }
  const dotGeometry = new THREE.BufferGeometry();
  dotGeometry.setAttribute("position", new THREE.BufferAttribute(lightDots, 3));
  group.add(new THREE.Points(dotGeometry, dotMaterial));

  const screenFrame = new THREE.Mesh(
    new THREE.PlaneGeometry(0.98, 0.62),
    new THREE.MeshBasicMaterial({
      color: "#16090a",
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
      depthTest: false
    })
  );
  screenFrame.position.set(1.56, 0.5, -0.9);
  screenFrame.rotation.y = -0.2;
  group.add(screenFrame);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.84, 0.48),
    new THREE.MeshBasicMaterial({
      map: screenTexture,
      color: "#ff5a44",
      transparent: true,
      opacity: 0.74,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    })
  );
  screen.position.set(1.56, 0.5, -0.885);
  screen.rotation.y = -0.2;
  screen.renderOrder = 2;
  group.add(screen);

  const suitcaseMat = makeMat("#f2d9bd", { roughness: 0.42, metalness: 0.16, emissive: "#3a1710", emissiveIntensity: 0.18 });
  const trimMat = makeMat("#b87333", { roughness: 0.28, metalness: 0.62, emissive: "#3c160c", emissiveIntensity: 0.22 });
  const suitcase = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.34, 0.16), suitcaseMat);
  suitcase.position.set(1.28, -0.37, 0.2);
  const handle = new THREE.Group();
  const handleRodGeometry = new THREE.BoxGeometry(0.012, 0.18, 0.012);
  const leftRod = new THREE.Mesh(handleRodGeometry, trimMat);
  leftRod.position.set(1.235, -0.16, 0.2);
  const rightRod = new THREE.Mesh(handleRodGeometry.clone(), trimMat);
  rightRod.position.set(1.325, -0.16, 0.2);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.016, 0.014), trimMat);
  grip.position.set(1.28, -0.065, 0.2);
  handle.add(leftRod, rightRod, grip);
  const ticket = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.01), makeMat("#1b0f0e", { emissive: accent, emissiveIntensity: 0.42 }));
  ticket.position.set(1.52, -0.5, 0.28);
  ticket.rotation.set(-0.42, 0.14, -0.2);
  group.add(suitcase, handle, ticket);

  return group;
}

export function StageCanvas({ scene }: StageCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef(scene);
  const assetRef = useRef<string | null>(null);

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  useEffect(() => {
    if (!hostRef.current) return;

    const host = hostRef.current;
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    host.appendChild(renderer.domElement);

    const stage = new THREE.Scene();
    stage.fog = new THREE.FogExp2("#080304", 0.18);

    const camera = new THREE.PerspectiveCamera(36, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.set(0.2, 0.78, 4.35);

    const ambient = new THREE.AmbientLight("#d6b6a5", 0.95);
    const key = new THREE.SpotLight("#fff1db", 3.2, 8, 0.38, 0.58, 1.2);
    key.position.set(0.7, 3.2, 2.8);
    key.target.position.set(0.7, 0.1, 0);
    const red = new THREE.PointLight(sceneRef.current.stage.accent, 4.5, 5.2);
    red.position.set(-1.75, 0.1, 1.8);
    stage.add(ambient, key, key.target, red);

    const floorMat = makeMat(sceneRef.current.stage.floor, { roughness: 0.22, metalness: 0.24 });
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.3, 0.12, 96), floorMat);
    floor.position.set(0.45, -0.69, 0);
    floor.scale.z = 0.63;
    floor.receiveShadow = true;
    stage.add(floor);

    let wheat = createWheatField(sceneRef.current.stage.accent, sceneRef.current.stage.profile);
    let lights = createLightRing(sceneRef.current.stage.accent, sceneRef.current.stage.profile);
    stage.add(wheat, lights);

    const toy = createToy();
    stage.add(toy.group);

    const hazeMat = new THREE.MeshBasicMaterial({
      color: sceneRef.current.stage.accent,
      transparent: true,
      opacity: 0.08,
      depthWrite: false
    });
    const haze = new THREE.Mesh(new THREE.SphereGeometry(1.8, 32, 18), hazeMat);
    haze.position.set(-0.9, -0.2, -0.85);
    haze.scale.set(1.8, 0.48, 0.5);
    stage.add(haze);

    const starsGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(160 * 3);
    for (let i = 0; i < 160; i += 1) {
      starPositions[i * 3] = (Math.random() - 0.5) * 6.5;
      starPositions[i * 3 + 1] = 0.4 + Math.random() * 1.7;
      starPositions[i * 3 + 2] = -1.4 - Math.random() * 1.8;
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(
      starsGeo,
      new THREE.PointsMaterial({ color: "#9fb7ff", size: 0.018, transparent: true, opacity: 0.72 })
    );
    stage.add(stars);

    const redWheatConcertFx = createRedWheatConcertFx("#f0443e");
    redWheatConcertFx.visible = isRedWheatConcert(sceneRef.current);
    stage.add(redWheatConcertFx);

    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    const disposeMaterial = (material: THREE.Material) => {
      const mapped = material as THREE.Material & {
        map?: THREE.Texture | null;
        alphaMap?: THREE.Texture | null;
      };
      mapped.map?.dispose();
      mapped.alphaMap?.dispose();
      material.dispose();
    };

    const disposeObject = (root: THREE.Object3D) => {
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(disposeMaterial);
          } else {
            disposeMaterial(obj.material);
          }
        }
      });
    };

    let activeSpriteGroup: THREE.Group | null = null;
    let activeSpriteDisplay: SpriteDisplay | null = null;
    const fadeScaleTarget = new THREE.Vector3(1, 1, 1);

    const applySpritePlacement = (spriteGroup: THREE.Group, display: SpriteDisplay) => {
      const anchor = getStageAnchor(host.clientWidth);
      const position = resolveSpritePosition(display, window.innerWidth, window.innerHeight);
      const rotation = display.rotation ?? [0, 0, 0];
      spriteGroup.position.set(position[0] + anchor.spriteXOffset, position[1] + anchor.spriteYOffset, position[2]);
      spriteGroup.rotation.set(rotation[0], rotation[1], rotation[2]);
    };

    const prepareFadeMaterial = (material: THREE.Material) => {
      const faded = material as THREE.Material & { opacity: number; transparent: boolean; userData: { baseOpacity?: number } };
      faded.userData.baseOpacity = faded.opacity;
      faded.transparent = true;
    };

    const setObjectOpacity = (root: THREE.Object3D, opacity: number) => {
      root.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach((material) => {
          const faded = material as THREE.Material & { opacity: number; userData: { baseOpacity?: number } };
          faded.opacity = (faded.userData.baseOpacity ?? faded.opacity) * opacity;
        });
      });
    };

    const markSpriteExiting = (spriteGroup: THREE.Object3D) => {
      spriteGroup.userData.exiting = true;
      spriteGroup.userData.targetOpacity = 0;
    };

    const removeSpriteGroup = (spriteGroup: THREE.Object3D) => {
      disposeObject(spriteGroup);
      toy.modelSlot.remove(spriteGroup);
    };

    const clearModelSlot = () => {
      activeSpriteGroup = null;
      activeSpriteDisplay = null;
      delete host.dataset.spriteAsset;
      host.dataset.spriteLoaded = "false";
      host.dataset.spriteTransition = "settled";
      toy.modelSlot.children.forEach(disposeObject);
      toy.modelSlot.clear();
    };

    const loadSprite = (next: StoryScene) => {
      const display = next.toyDisplay;
      if (!display || display.type !== "sprite") return false;
      if (display.assetReady === false) return false;

      const assetKey = `sprite:${display.imagePath}`;
      if (assetRef.current === assetKey) {
        if (activeSpriteGroup) {
          activeSpriteDisplay = display;
          applySpritePlacement(activeSpriteGroup, display);
          host.dataset.modelState = "sprite";
          host.dataset.spriteAsset = display.imagePath;
          host.dataset.spriteLoaded = "true";
          return true;
        }

        assetRef.current = null;
      }

      assetRef.current = assetKey;
      if (activeSpriteGroup) {
        host.dataset.modelState = "sprite";
        host.dataset.spriteLoaded = "false";
        host.dataset.spriteTransition = "transitioning";
      } else {
        clearModelSlot();
        toy.placeholder.visible = true;
        host.dataset.modelState = "placeholder";
      }

      textureLoader.load(
        display.imagePath,
        (texture) => {
          if (assetRef.current !== assetKey) {
            texture.dispose();
            return;
          }

          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

          const anchor = getStageAnchor(host.clientWidth);
          const height = (display.height ?? 1.75) * anchor.spriteScale;
          const image = texture.image as HTMLImageElement | ImageBitmap;
          const width = height * ((image.width || 1) / (image.height || 1));
          const spriteGroup = new THREE.Group();
          const geometry = new THREE.PlaneGeometry(width, height);
          spriteGroup.userData.spriteLayer = true;
          spriteGroup.userData.currentOpacity = 0;
          spriteGroup.userData.targetOpacity = 1;
          spriteGroup.scale.setScalar(0.96);

          const doll = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({
              map: texture,
              transparent: true,
              alphaTest: 0.05,
              depthWrite: false,
              depthTest: false,
              side: THREE.DoubleSide,
              toneMapped: false
            })
          );
          doll.position.z = 0.02;
          doll.renderOrder = 3;
          prepareFadeMaterial(doll.material);

          const fillLightConfig = display.fillLight;
          const fillLight =
            fillLightConfig && (fillLightConfig.opacity ?? DEFAULT_SPRITE_FILL_LIGHT.opacity) > 0
              ? new THREE.Mesh(
                  geometry.clone(),
                  new THREE.MeshBasicMaterial({
                    map: texture.clone(),
                    color: fillLightConfig.color ?? DEFAULT_SPRITE_FILL_LIGHT.color,
                    transparent: true,
                    opacity: fillLightConfig.opacity ?? DEFAULT_SPRITE_FILL_LIGHT.opacity,
                    alphaTest: 0.05,
                    depthWrite: false,
                    depthTest: false,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide,
                    toneMapped: false
                  })
                )
              : null;
          if (fillLight) {
            const fillScale = fillLightConfig?.scale ?? DEFAULT_SPRITE_FILL_LIGHT.scale;
            fillLight.position.z = 0.034;
            fillLight.scale.set(fillScale, fillScale, 1);
            fillLight.renderOrder = 3.5;
            prepareFadeMaterial(fillLight.material);
          }

          const shadow = new THREE.Mesh(
            new THREE.CircleGeometry(0.46, 48),
            new THREE.MeshBasicMaterial({
              color: "#060203",
              transparent: true,
              opacity: display.contactShadow?.opacity ?? 0.34,
              depthWrite: false,
              depthTest: false
            })
          );
          const shadowScale = display.contactShadow?.scale ?? [1.08, 0.32];
          shadow.rotation.x = -Math.PI / 2;
          shadow.position.set(
            display.contactShadow?.xOffset ?? 0,
            -height * 0.5 + 0.015 + (display.contactShadow?.yOffset ?? 0),
            display.contactShadow?.zOffset ?? 0.04
          );
          shadow.scale.set(shadowScale[0], shadowScale[1], 1);
          shadow.renderOrder = 1;
          prepareFadeMaterial(shadow.material);

          applySpritePlacement(spriteGroup, display);
          spriteGroup.add(shadow, doll);
          if (fillLight) {
            spriteGroup.add(fillLight);
          }

          const useKeyLight = isRedWheatConcert(next) || display.keyLight === true;
          if (useKeyLight) {
            const keyLight = new THREE.Mesh(
              geometry.clone(),
              new THREE.MeshBasicMaterial({
                map: createSpriteKeyLightTexture(),
                transparent: true,
                opacity: 0.58,
                depthWrite: false,
                depthTest: false,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                toneMapped: false
              })
            );
            keyLight.position.z = 0.048;
            keyLight.renderOrder = 4;
            prepareFadeMaterial(keyLight.material);
            spriteGroup.add(keyLight);
          }

          toy.modelSlot.children.forEach((child) => {
            if (child.userData.spriteLayer) markSpriteExiting(child);
          });
          setObjectOpacity(spriteGroup, 0);
          activeSpriteGroup = spriteGroup;
          activeSpriteDisplay = display;
          toy.modelSlot.add(spriteGroup);
          toy.placeholder.visible = false;
          host.dataset.modelState = "sprite";
          host.dataset.spriteAsset = display.imagePath;
          host.dataset.spriteLoaded = "true";
          host.dataset.spriteTransition = "transitioning";
        },
        undefined,
        () => {
          if (assetRef.current === assetKey) {
            if (!activeSpriteGroup) {
              toy.placeholder.visible = true;
              host.dataset.modelState = "placeholder";
            }
            delete host.dataset.spriteAsset;
            host.dataset.spriteLoaded = "false";
          }
        }
      );

      return true;
    };

    const loadModel = async (next: StoryScene) => {
      const path = next.modelPath;
      const assetKey = `glb:${path}`;
      if (assetRef.current === assetKey) return;
      assetRef.current = assetKey;
      clearModelSlot();
      toy.placeholder.visible = true;
      host.dataset.modelState = "placeholder";
      const response = await fetch(path, { method: "HEAD" }).catch(() => null);
      const type = response?.headers.get("content-type") ?? "";
      if (!response?.ok || type.includes("text/html")) {
        return;
      }
      loader.load(
        path,
        (gltf) => {
          if (assetRef.current !== assetKey) return;
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);
          const scale = (1.55 / Math.max(size.x, size.y, size.z, 1)) * (next.modelTransform?.scale ?? 1);
          model.scale.setScalar(scale);
          model.position.sub(center.multiplyScalar(scale));
          const position = next.modelTransform?.position;
          if (position) {
            model.position.add(new THREE.Vector3(position[0], position[1], position[2]));
          }
          const rotation = next.modelTransform?.rotation;
          if (rotation) {
            model.rotation.set(rotation[0], rotation[1], rotation[2]);
          }
          toy.modelSlot.add(model);
          toy.placeholder.visible = false;
          host.dataset.modelState = "glb";
        },
        undefined,
        () => {
          toy.placeholder.visible = true;
          host.dataset.modelState = "placeholder";
        }
      );
    };

    const applyScene = (next: StoryScene) => {
      const accent = new THREE.Color(next.stage.accent);
      const concertProfile = isRedWheatConcert(next);
      host.dataset.stageProfile = next.stage.profile ?? "default";
      red.color = accent;
      hazeMat.color = accent;
      floorMat.color.set(next.stage.floor);
      toy.outfit.color.set(next.mood === "childhood" ? "#f7b267" : next.mood === "graduation" ? "#111827" : next.mood === "tibet" ? "#26415c" : "#0e0d0f");
      toy.belt.color.set(concertProfile ? "#b87333" : next.stage.secondary);
      toy.hair.color.set(next.mood === "childhood" ? "#2a1b16" : "#111012");
      stage.remove(wheat, lights);
      wheat.traverse((obj) => {
        if (obj instanceof THREE.Mesh) obj.geometry.dispose();
      });
      lights.traverse((obj) => {
        if (obj instanceof THREE.Mesh) obj.geometry.dispose();
      });
      wheat = createWheatField(next.stage.accent, next.stage.profile);
      lights = createLightRing(next.stage.accent, next.stage.profile);
      const generatedBackground = Boolean(next.backgroundAsset?.imagePath);
      const usesGeneratedPlate = generatedBackground && next.toyDisplay?.type === "sprite";
      wheat.visible = !usesGeneratedPlate;
      lights.visible = !usesGeneratedPlate;
      floor.visible = !usesGeneratedPlate;
      haze.visible = !usesGeneratedPlate;
      stars.visible = !usesGeneratedPlate;
      stage.add(wheat, lights);
      redWheatConcertFx.visible = concertProfile && !generatedBackground;
      if (next.modelReady) {
        loadModel(next);
      } else if (loadSprite(next)) {
        return;
      } else {
        assetRef.current = null;
        clearModelSlot();
        toy.placeholder.visible = true;
        host.dataset.modelState = "placeholder";
      }
    };

    applyScene(sceneRef.current);

    let lastSceneId = sceneRef.current.id;
    let frame = 0;
    let raf = 0;

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (activeSpriteGroup && activeSpriteDisplay) {
        applySpritePlacement(activeSpriteGroup, activeSpriteDisplay);
      }
    };

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const current = sceneRef.current;
      if (current.id !== lastSceneId) {
        lastSceneId = current.id;
        applyScene(current);
        const enteringSpriteToy = current.toyDisplay?.type === "sprite";
        const anchor = getStageAnchor(host.clientWidth);
        toy.group.scale.setScalar(enteringSpriteToy ? anchor.spriteEntryScale : anchor.placeholderEntryScale);
        toy.group.rotation.y = enteringSpriteToy ? -0.12 : -0.82;
      }

      frame += 0.01;
      const isSpriteToy = current.toyDisplay?.type === "sprite";
      const anchor = getStageAnchor(host.clientWidth);
      const baseScale = isSpriteToy ? anchor.spriteTargetScale : anchor.placeholderTargetScale;
      const targetScale = baseScale;
      toy.group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05);
      const targetRotationY = isSpriteToy ? -0.04 : -0.18;
      toy.group.rotation.y += (targetRotationY - toy.group.rotation.y) * 0.04;
      const visualBaseY = anchor.toyBaseY + (isSpriteToy ? 0 : anchor.placeholderBaseLift);
      toy.group.position.y = visualBaseY;
      const removableSpriteGroups: THREE.Object3D[] = [];
      let spriteTransitioning = false;
      toy.modelSlot.children.forEach((child) => {
        if (!child.userData.spriteLayer) return;
        const targetOpacity = child.userData.targetOpacity ?? 1;
        const currentOpacity = child.userData.currentOpacity ?? 0;
        const nextOpacity = currentOpacity + (targetOpacity - currentOpacity) * 0.09;
        child.userData.currentOpacity = Math.abs(nextOpacity - targetOpacity) < 0.012 ? targetOpacity : nextOpacity;
        setObjectOpacity(child, child.userData.currentOpacity);
        fadeScaleTarget.setScalar(child.userData.exiting ? 0.985 : 1);
        child.scale.lerp(fadeScaleTarget, 0.08);
        if (child.userData.exiting && child.userData.currentOpacity <= 0.025) {
          removableSpriteGroups.push(child);
        } else if (child.userData.currentOpacity !== targetOpacity) {
          spriteTransitioning = true;
        }
      });
      removableSpriteGroups.forEach(removeSpriteGroup);
      if (activeSpriteGroup) {
        host.dataset.spriteLoaded = !activeSpriteGroup.userData.exiting ? "true" : "false";
      }
      host.dataset.spriteTransition = spriteTransitioning ? "transitioning" : "settled";
      if (isRedWheatConcert(current)) {
        lights.rotation.y = 0;
        wheat.rotation.y = 0;
      } else {
        lights.rotation.y += 0.0018;
        wheat.rotation.y = Math.sin(frame * 0.25) * 0.02;
      }
      stars.rotation.y += 0.0004;
      renderer.render(stage, camera);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    animate();

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      assetRef.current = null;
      host.removeChild(renderer.domElement);
      renderer.dispose();
      stage.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(disposeMaterial);
          } else {
            disposeMaterial(obj.material);
          }
        }
      });
      toy.materials.forEach((mat) => mat.dispose());
    };
  }, []);

  return <div ref={hostRef} className="stage-canvas" aria-hidden="true" />;
}
