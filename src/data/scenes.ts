export type SceneMood =
  | "childhood"
  | "halloween"
  | "graduation"
  | "kunming"
  | "haikou"
  | "tibet"
  | "shangriLa";

export interface StoryScene {
  id: string;
  order: number;
  title: string;
  period: string;
  copy: string;
  mainPhoto: string;
  photoStack?: string[];
  modelPath: string;
  modelReady: boolean;
  modelTransform?: {
    scale?: number;
    position?: [number, number, number];
    rotation?: [number, number, number];
  };
  toyDisplay?: {
    type: "sprite";
    imagePath: string;
    assetReady?: boolean;
    height?: number;
    position?: [number, number, number];
    mobilePosition?: [number, number, number];
    responsivePositions?: {
      aspect: number;
      position: [number, number, number];
    }[];
    contactShadow?: {
      xOffset?: number;
      yOffset?: number;
      zOffset?: number;
      scale?: [number, number];
      opacity?: number;
    };
    fillLight?: {
      color?: string;
      opacity?: number;
      scale?: number;
    };
    bodyLift?: {
      color?: string;
      opacity?: number;
      scale?: number;
    };
    keyLight?: boolean;
    rotation?: [number, number, number];
    glowColor?: string;
  };
  backgroundAsset?: {
    type: "image";
    imagePath: string;
    position?: string;
    mobilePosition?: string;
    opacity?: number;
    mask?: {
      left?: number;
      mid?: number;
      right?: number;
    };
  };
  photoLayout?: {
    width?: string;
    marginLeft?: string;
    desktopX?: string;
    inactiveY?: string;
    activeY?: string;
    rotate?: string;
    activeRotate?: string;
    maxHeight?: string;
    mobileX?: string;
    shadowOneX?: string;
    shadowTwoX?: string;
    shadowTwoY?: string;
  };
  copyMask?: {
    desktopStart?: number;
    desktopMid?: number;
    desktopEnd?: number;
    mobileStart?: number;
    mobileMid?: number;
    mobileEnd?: number;
  };
  mood: SceneMood;
  toyReferences: {
    face: string[];
    outfit: string[];
    mood: string[];
  };
  stage: {
    name: string;
    profile?: "red-wheat-concert";
    accent: string;
    secondary: string;
    floor: string;
  };
  toy: {
    hair: string;
    outfit: string;
    belt?: string;
    props: string[];
  };
}

export const scenes: StoryScene[] = [
  {
    id: "sence1",
    order: 1,
    title: "小时候",
    period: "还没遇见你",
    copy: "那时候我还不知道，未来会有一个这么可爱的人走进我的生活。",
    mainPhoto: "/photos/sence1/1a0fbaf177519bb0490055fde45b3c82.jpg",
    photoStack: [
      "/photos/sence1/1a0fbaf177519bb0490055fde45b3c82.jpg",
      "/photos/sence1/51091af19439881997d8a446254314e5.jpg"
    ],
    modelPath: "/models/sence1.glb",
    modelReady: false,
    toyDisplay: {
      type: "sprite",
      imagePath: "/toys/sence1-toy-2d-v2.png",
      assetReady: true,
      height: 1.52,
      position: [-0.2, 1.1, 0.08],
      mobilePosition: [-0.08, 0.45, 0.08],
      fillLight: { color: "#fff1d6", opacity: 0.12 },
      bodyLift: { color: "#fff8ea", opacity: 0.03 },
      rotation: [0, -0.03, 0],
      glowColor: "#f7b267"
    },
    backgroundAsset: {
      type: "image",
      imagePath: "/backgrounds/sence1-dali-bai-courtyard.png",
      position: "center center",
      mobilePosition: "58% center",
      opacity: 0.96,
      mask: { left: 0.12, mid: 0.03, right: 0.1 }
    },
    photoLayout: {
      width: "clamp(282px, 24vw, 390px)",
      desktopX: "-7.6vw",
      maxHeight: "min(60svh, 630px)",
      mobileX: "clamp(4px, 3vw, 24px)"
    },
    copyMask: {
      desktopStart: 0.54,
      desktopMid: 0.26,
      desktopEnd: 0.03,
      mobileStart: 0.74,
      mobileMid: 0.38,
      mobileEnd: 0.1
    },
    mood: "childhood",
    toyReferences: {
      face: ["/photos/sence1/1a0fbaf177519bb0490055fde45b3c82.jpg"],
      outfit: ["/photos/sence1/51091af19439881997d8a446254314e5.jpg"],
      mood: ["childhood", "soft plush", "small keepsake"]
    },
    stage: {
      name: "白族院落",
      accent: "#f7b267",
      secondary: "#ffd7a8",
      floor: "#271713"
    },
    toy: {
      hair: "soft-dark",
      outfit: "warm-childhood",
      props: ["tiny ribbon", "small star"]
    }
  },
  {
    id: "sence2",
    order: 2,
    title: "万圣节",
    period: "大学",
    copy: "搞怪、明亮、毫不费力地成为那天最特别的画面。",
    mainPhoto: "/photos/sence2/2c7b6ef66e62b1580398a4e6bd7e682d.jpg",
    photoStack: [
      "/photos/sence2/2c7b6ef66e62b1580398a4e6bd7e682d.jpg",
      "/photos/sence2/e340f687dfa72fc05e4d5b40dd66b9e3.jpg",
      "/photos/sence2/f77e849a5f04967fce33a7c5030cf0b0.jpg"
    ],
    modelPath: "/models/sence2.glb",
    modelReady: false,
    toyDisplay: {
      type: "sprite",
      imagePath: "/toys/sence2-toy-2d-v2.png",
      assetReady: true,
      height: 1.74,
      position: [-0.24, 1.22, 0.08],
      mobilePosition: [-0.08, 0.48, 0.08],
      responsivePositions: [
        { aspect: 1.42, position: [-0.24, 1.22, 0.08] },
        { aspect: 1.6, position: [-0.26, 1.22, 0.08] },
        { aspect: 1.78, position: [-0.4, 1.22, 0.08] },
        { aspect: 1.84, position: [-0.48, 1.22, 0.08] },
        { aspect: 2.0, position: [-0.52, 1.22, 0.08] }
      ],
      contactShadow: { yOffset: 0.07, scale: [0.9, 0.26], opacity: 0.32 },
      fillLight: { color: "#ffe7c7", opacity: 0.16 },
      bodyLift: { color: "#fff2df", opacity: 0.08 },
      rotation: [0, -0.04, 0],
      glowColor: "#b96cff"
    },
    backgroundAsset: {
      type: "image",
      imagePath: "/backgrounds/sence2-halloween-campus.png",
      position: "center center",
      mobilePosition: "58% center",
      opacity: 0.96,
      mask: { left: 0.14, mid: 0.03, right: 0.1 }
    },
    photoLayout: {
      width: "clamp(282px, 24vw, 390px)",
      desktopX: "-7.5vw",
      maxHeight: "min(60svh, 630px)",
      mobileX: "clamp(4px, 3vw, 24px)"
    },
    copyMask: {
      desktopStart: 0.56,
      desktopMid: 0.28,
      desktopEnd: 0.04,
      mobileStart: 0.76,
      mobileMid: 0.4,
      mobileEnd: 0.11
    },
    mood: "halloween",
    toyReferences: {
      face: ["/photos/sence2/2c7b6ef66e62b1580398a4e6bd7e682d.jpg"],
      outfit: [
        "/photos/sence2/e340f687dfa72fc05e4d5b40dd66b9e3.jpg",
        "/photos/sence2/f77e849a5f04967fce33a7c5030cf0b0.jpg"
      ],
      mood: ["college halloween", "playful makeup", "mischievous"]
    },
    stage: {
      name: "校园夜色",
      accent: "#b96cff",
      secondary: "#ff8c3a",
      floor: "#151022"
    },
    toy: {
      hair: "dark",
      outfit: "halloween-playful",
      props: ["little mask", "pumpkin charm"]
    }
  },
  {
    id: "sence3",
    order: 3,
    title: "毕业",
    period: "大学毕业",
    copy: "有些照片像一个句号，也像新的开头。",
    mainPhoto: "/photos/sence3/eb9ecb0bd1ff455cfdc9132f0877d4b6.jpg",
    photoStack: [
      "/photos/sence3/eb9ecb0bd1ff455cfdc9132f0877d4b6.jpg",
      "/photos/sence3/0a9953257f91c2fae1b7715aa81de4c3.jpg"
    ],
    modelPath: "/models/sence3.glb",
    modelReady: false,
    toyDisplay: {
      type: "sprite",
      imagePath: "/toys/sence3-toy-2d-v2.png",
      assetReady: true,
      height: 1.82,
      position: [-0.26, 1.17, 0.08],
      mobilePosition: [-0.1, 0.45, 0.08],
      responsivePositions: [
        { aspect: 1.42, position: [-0.26, 1.17, 0.08] },
        { aspect: 1.6, position: [-0.28, 1.17, 0.08] },
        { aspect: 1.78, position: [-0.42, 1.17, 0.08] },
        { aspect: 1.84, position: [-0.5, 1.17, 0.08] },
        { aspect: 2.0, position: [-0.54, 1.17, 0.08] }
      ],
      contactShadow: { yOffset: 0.16, scale: [0.76, 0.22], opacity: 0.3 },
      fillLight: { color: "#fff5dd", opacity: 0.14 },
      bodyLift: { color: "#fff8ec", opacity: 0.07 },
      rotation: [0, -0.03, 0],
      glowColor: "#74d1a6"
    },
    backgroundAsset: {
      type: "image",
      imagePath: "/backgrounds/sence3-graduation-lawn.png",
      position: "center center",
      mobilePosition: "58% center",
      opacity: 0.95,
      mask: { left: 0.13, mid: 0.03, right: 0.09 }
    },
    photoLayout: {
      width: "clamp(278px, 23vw, 380px)",
      desktopX: "-7.5vw",
      maxHeight: "min(59svh, 610px)",
      mobileX: "clamp(4px, 3vw, 24px)"
    },
    copyMask: {
      desktopStart: 0.54,
      desktopMid: 0.26,
      desktopEnd: 0.03,
      mobileStart: 0.74,
      mobileMid: 0.38,
      mobileEnd: 0.1
    },
    mood: "graduation",
    toyReferences: {
      face: ["/photos/sence3/0a9953257f91c2fae1b7715aa81de4c3.jpg"],
      outfit: ["/photos/sence3/eb9ecb0bd1ff455cfdc9132f0877d4b6.jpg"],
      mood: ["graduation photo", "campus", "keepsake"]
    },
    stage: {
      name: "毕业草坪",
      accent: "#74d1a6",
      secondary: "#f7f3df",
      floor: "#13251f"
    },
    toy: {
      hair: "dark",
      outfit: "graduation",
      props: ["rolled diploma", "small flower"]
    }
  },
  {
    id: "sence4",
    order: 4,
    title: "昆明",
    period: "第一次胶片机",
    copy: "跨年前后的昆明，被胶片偷偷留下了一点柔软的光。",
    mainPhoto: "/photos/sence4/2.jpg",
    photoStack: ["/photos/sence4/2.jpg", "/photos/sence4/1.jpg"],
    modelPath: "/models/sence4.glb",
    modelReady: false,
    toyDisplay: {
      type: "sprite",
      imagePath: "/toys/sence4-toy-2d-v2.png",
      assetReady: true,
      height: 1.84,
      position: [-0.26, 1.16, 0.08],
      mobilePosition: [-0.1, 0.45, 0.08],
      responsivePositions: [
        { aspect: 1.42, position: [-0.26, 1.16, 0.08] },
        { aspect: 1.6, position: [-0.28, 1.16, 0.08] },
        { aspect: 1.78, position: [-0.42, 1.16, 0.08] },
        { aspect: 1.84, position: [-0.5, 1.16, 0.08] },
        { aspect: 2.0, position: [-0.54, 1.16, 0.08] }
      ],
      contactShadow: { yOffset: 0.12, scale: [0.78, 0.22], opacity: 0.3 },
      fillLight: { color: "#ffe4cc", opacity: 0.16 },
      bodyLift: { color: "#fff0e2", opacity: 0.08 },
      rotation: [0, -0.03, 0],
      glowColor: "#ff9c73"
    },
    backgroundAsset: {
      type: "image",
      imagePath: "/backgrounds/sence4-kunming-film-street.png",
      position: "center center",
      mobilePosition: "58% center",
      opacity: 0.96,
      mask: { left: 0.14, mid: 0.03, right: 0.1 }
    },
    photoLayout: {
      width: "clamp(300px, 25vw, 420px)",
      desktopX: "-7.6vw",
      maxHeight: "min(55svh, 560px)",
      mobileX: "clamp(4px, 3vw, 24px)"
    },
    copyMask: {
      desktopStart: 0.56,
      desktopMid: 0.28,
      desktopEnd: 0.04,
      mobileStart: 0.76,
      mobileMid: 0.4,
      mobileEnd: 0.11
    },
    mood: "kunming",
    toyReferences: {
      face: ["/photos/sence4/1.jpg"],
      outfit: ["/photos/sence4/2.jpg"],
      mood: ["film camera", "new year", "Kunming"]
    },
    stage: {
      name: "胶片街角",
      accent: "#ff9c73",
      secondary: "#6fc7d8",
      floor: "#241b19"
    },
    toy: {
      hair: "dark",
      outfit: "film-date",
      props: ["tiny camera", "new year light"]
    }
  },
  {
    id: "sence5",
    order: 5,
    title: "海口",
    period: "第一次一起看海",
    copy: "第一次一起坐飞机，第一次一起看海，也把一整片红色麦田记在了晚上。",
    mainPhoto: "/photos/sence5/3.jpg",
    photoStack: ["/photos/sence5/3.jpg", "/photos/sence5/1.jpg", "/photos/sence5/2.jpg"],
    modelPath: "/models/sence5.glb",
    modelReady: false,
    modelTransform: {
      scale: 0.9,
      position: [-0.08, 0.48, 0],
      rotation: [0, 0.08, 1.5708]
    },
    toyDisplay: {
      type: "sprite",
      imagePath: "/toys/sence5-toy-2d.png",
      height: 2.04,
      position: [-0.05, 1.12, 0.08],
      mobilePosition: [-0.16, 0.32, 0.08],
      responsivePositions: [
        { aspect: 1.42, position: [-0.05, 1.12, 0.08] },
        { aspect: 1.6, position: [-0.05, 1.12, 0.08] },
        { aspect: 1.78, position: [-0.33, 1.12, 0.08] },
        { aspect: 1.84, position: [-0.46, 1.12, 0.08] },
        { aspect: 2.0, position: [-0.52, 1.12, 0.08] }
      ],
      rotation: [0, -0.04, 0],
      fillLight: { color: "#f6fbff", opacity: 0.12 },
      bodyLift: { color: "#fff4ea", opacity: 0.06 },
      keyLight: true,
      glowColor: "#ff5a42"
    },
    backgroundAsset: {
      type: "image",
      imagePath: "/backgrounds/sence5-red-wheat-concert.png",
      position: "center center",
      mobilePosition: "58% center",
      opacity: 0.96
    },
    photoLayout: {
      width: "clamp(300px, 22vw, 430px)",
      marginLeft: "0px",
      desktopX: "-14.5vw",
      inactiveY: "28px",
      activeY: "0px",
      rotate: "-1.6deg",
      activeRotate: "-1.2deg",
      maxHeight: "min(58svh, 620px)",
      shadowOneX: "-56px",
      shadowTwoX: "-96px",
      shadowTwoY: "38px"
    },
    copyMask: {
      desktopStart: 0.68,
      desktopMid: 0.38,
      desktopEnd: 0.08,
      mobileStart: 0.94,
      mobileMid: 0.56,
      mobileEnd: 0.12
    },
    mood: "haikou",
    toyReferences: {
      face: ["/photos/sence5/1.jpg"],
      outfit: ["/photos/sence5/2.jpg", "/photos/sence5/3.jpg"],
      mood: ["red wheat-field concert stage", "Haikou beach", "sunset sea"]
    },
    stage: {
      name: "红光麦田舞台",
      profile: "red-wheat-concert",
      accent: "#f0443e",
      secondary: "#f2b45f",
      floor: "#120708"
    },
    toy: {
      hair: "long-black-wavy",
      outfit: "black mini dress, black boots, small black bag",
      belt: "ornate bronze and silver circular belt",
      props: ["ticket stub", "tiny suitcase", "sea breeze"]
    }
  },
  {
    id: "sence6",
    order: 6,
    title: "香格里拉",
    period: "她自己的远方",
    copy: "你走向香格里拉的风里，也把自由拍得很好看。",
    mainPhoto: "/photos/sence6/78720d4affcbe16b30b8f3932ac81ac5.jpg",
    photoStack: [
      "/photos/sence6/78720d4affcbe16b30b8f3932ac81ac5.jpg",
      "/photos/sence6/5ad6a40732733000ab60899abbc7a2e1.jpg",
      "/photos/sence6/5d28b1594f3f41844e6b59c1d4f72357.jpg",
      "/photos/sence6/89c15430f4c2cccc26dd223f4c88a525.jpg",
      "/photos/sence6/b0f83b87d8fa82b9a51de59b9dcf5a6b.jpg",
      "/photos/sence6/f17e774255d76ca78e94420861169106.jpg"
    ],
    modelPath: "/models/sence6.glb",
    modelReady: false,
    toyDisplay: {
      type: "sprite",
      imagePath: "/toys/sence6-toy-2d-v2.png",
      assetReady: true,
      height: 1.82,
      position: [-0.3, 1.23, 0.08],
      mobilePosition: [-0.12, 0.48, 0.08],
      responsivePositions: [
        { aspect: 1.42, position: [-0.3, 1.23, 0.08] },
        { aspect: 1.6, position: [-0.32, 1.23, 0.08] },
        { aspect: 1.78, position: [-0.46, 1.23, 0.08] },
        { aspect: 1.84, position: [-0.54, 1.23, 0.08] },
        { aspect: 2.0, position: [-0.58, 1.23, 0.08] }
      ],
      contactShadow: { yOffset: 0.1, scale: [0.82, 0.24], opacity: 0.3 },
      fillLight: { color: "#eaf6ff", opacity: 0.16 },
      bodyLift: { color: "#f3f8ff", opacity: 0.08 },
      rotation: [0, -0.03, 0],
      glowColor: "#6bb7ff"
    },
    backgroundAsset: {
      type: "image",
      imagePath: "/backgrounds/sence6-tibet-plateau.png",
      position: "center center",
      mobilePosition: "58% center",
      opacity: 0.96,
      mask: { left: 0.08, mid: 0.02, right: 0.08 }
    },
    photoLayout: {
      width: "clamp(282px, 24vw, 390px)",
      desktopX: "-7.6vw",
      maxHeight: "min(60svh, 630px)",
      mobileX: "clamp(4px, 3vw, 24px)"
    },
    copyMask: {
      desktopStart: 0.48,
      desktopMid: 0.22,
      desktopEnd: 0.04,
      mobileStart: 0.68,
      mobileMid: 0.34,
      mobileEnd: 0.09
    },
    mood: "shangriLa",
    toyReferences: {
      face: [
        "/photos/sence6/5ad6a40732733000ab60899abbc7a2e1.jpg",
        "/photos/sence6/5d28b1594f3f41844e6b59c1d4f72357.jpg"
      ],
      outfit: [
        "/photos/sence6/78720d4affcbe16b30b8f3932ac81ac5.jpg",
        "/photos/sence6/f17e774255d76ca78e94420861169106.jpg"
      ],
      mood: ["Shangri-La", "clear sky", "travel freedom"]
    },
    stage: {
      name: "香格里拉晴空",
      accent: "#6bb7ff",
      secondary: "#f5dba0",
      floor: "#0f1c25"
    },
    toy: {
      hair: "dark",
      outfit: "travel",
      props: ["small prayer flag", "wind"]
    }
  }
];

export const wallPhotos = scenes.map((scene) => ({
  id: scene.id,
  title: scene.title,
  src: scene.mainPhoto
}));
