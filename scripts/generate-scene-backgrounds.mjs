import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const outputDir = path.join(root, "public/backgrounds");

const image = (relativePath) => {
  const absolutePath = path.join(root, relativePath);
  const ext = path.extname(absolutePath).slice(1).toLowerCase();
  const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${fs.readFileSync(absolutePath).toString("base64")}`;
};

const sharedStyle = `
  html, body {
    width: 1920px;
    height: 1080px;
    margin: 0;
    overflow: hidden;
    background: #050506;
  }

  .scene {
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    isolation: isolate;
    background: #050506;
  }

  .photo {
    position: absolute;
    object-fit: cover;
    pointer-events: none;
    user-select: none;
  }

  .grain,
  .vignette,
  .left-mask,
  .dust,
  .spot,
  .platform,
  .platform::before,
  .platform::after {
    position: absolute;
    pointer-events: none;
    content: "";
  }

  .grain {
    inset: 0;
    z-index: 80;
    opacity: 0.16;
    mix-blend-mode: overlay;
    background-image:
      radial-gradient(circle at 13% 17%, rgba(255,255,255,.16) 0 1px, transparent 1.4px),
      radial-gradient(circle at 61% 43%, rgba(255,255,255,.1) 0 1px, transparent 1.6px),
      radial-gradient(circle at 38% 72%, rgba(0,0,0,.28) 0 1px, transparent 1.5px);
    background-size: 19px 23px, 27px 31px, 33px 37px;
  }

  .vignette {
    inset: -1px;
    z-index: 90;
    background:
      radial-gradient(ellipse at 67% 50%, transparent 0 38%, rgba(0,0,0,.26) 68%, rgba(0,0,0,.78) 100%),
      linear-gradient(90deg, rgba(0,0,0,.7) 0%, rgba(0,0,0,.28) 28%, rgba(0,0,0,.08) 58%, rgba(0,0,0,.24) 100%),
      linear-gradient(180deg, rgba(0,0,0,.44), transparent 38%, rgba(0,0,0,.5));
  }

  .left-mask {
    inset: 0;
    z-index: 65;
    background: linear-gradient(90deg, rgba(4,3,5,.78), rgba(4,3,5,.38) 24%, rgba(4,3,5,.06) 58%, transparent);
  }

  .dust {
    inset: 0;
    z-index: 45;
    opacity: .35;
    background-image:
      radial-gradient(circle at 17% 32%, rgba(255,255,255,.22) 0 1.3px, transparent 1.7px),
      radial-gradient(circle at 43% 22%, rgba(255,255,255,.16) 0 1px, transparent 1.5px),
      radial-gradient(circle at 76% 66%, rgba(255,255,255,.18) 0 1.2px, transparent 1.8px);
    background-size: 143px 131px, 97px 109px, 179px 151px;
  }

  .spot {
    z-index: 42;
    top: -70px;
    left: 1120px;
    width: 360px;
    height: 780px;
    opacity: .52;
    clip-path: polygon(42% 0, 58% 0, 100% 100%, 0 100%);
    filter: blur(5px);
    background: linear-gradient(180deg, rgba(232,244,255,.76), rgba(184,215,255,.22) 48%, rgba(184,215,255,0));
    mix-blend-mode: screen;
  }

  .platform {
    z-index: 50;
    left: 1040px;
    top: 760px;
    width: 660px;
    height: 178px;
    border-radius: 50%;
    transform: perspective(680px) rotateX(58deg);
    background:
      radial-gradient(ellipse at 52% 46%, rgba(255,248,226,.42), rgba(165,92,54,.18) 30%, rgba(24,14,13,.92) 72%),
      repeating-linear-gradient(8deg, rgba(255,255,255,.08) 0 2px, transparent 2px 16px);
    border: 2px solid var(--rim, rgba(255,178,104,.7));
    box-shadow:
      0 18px 28px rgba(0,0,0,.5),
      0 0 42px var(--glow, rgba(255,144,86,.28)),
      inset 0 10px 26px rgba(255,255,255,.13),
      inset 0 -18px 28px rgba(0,0,0,.42);
  }

  .platform::before {
    left: 6%;
    top: 34%;
    width: 88%;
    height: 30%;
    border-radius: 50%;
    filter: blur(18px);
    background: var(--shine, rgba(255,228,188,.26));
  }

  .platform::after {
    left: 4%;
    bottom: -14px;
    width: 92%;
    height: 44px;
    border-radius: 50%;
    filter: blur(22px);
    background: rgba(0,0,0,.54);
  }

  .front-bulbs {
    position: absolute;
    z-index: 54;
    left: 900px;
    top: 925px;
    width: 900px;
    height: 80px;
    transform: perspective(800px) rotateX(54deg);
  }

  .front-bulbs span {
    position: absolute;
    top: 8px;
    width: 58px;
    height: 16px;
    border-radius: 50%;
    background: var(--bulb, #ffd6a0);
    box-shadow:
      0 0 14px var(--bulb, #ffd6a0),
      0 0 32px var(--bulb-glow, rgba(255,142,78,.68));
  }
`;

const bulbs = (count = 7) =>
  `<div class="front-bulbs">${Array.from({ length: count }, (_, index) => {
    const left = 60 + index * (760 / Math.max(count - 1, 1));
    const top = Math.sin(index * 1.6) * 8;
    return `<span style="left:${left}px;top:${10 + top}px"></span>`;
  }).join("")}</div>`;

const scenes = [
  {
    id: "sence1-dali-bai-courtyard",
    out: "sence1-dali-bai-courtyard.png",
    css: `
      .scene { --rim: rgba(246,184,110,.76); --glow: rgba(247,178,103,.3); --shine: rgba(255,238,206,.32); --bulb: #ffe4b6; --bulb-glow: rgba(247,178,103,.62); background: linear-gradient(180deg,#080707,#17100c 52%,#070606); }
      .child-bg { inset: -70px -70px -70px -70px; width: 2060px; height: 1220px; object-position: 38% 38%; filter: blur(14px) saturate(1.02) brightness(.84); opacity: .42; }
      .door-bg { left: 430px; top: 0; width: 1160px; height: 1080px; object-position: center; filter: blur(6px) saturate(.9) brightness(.82); opacity: .34; }
      .courtyard-wall { position:absolute; z-index:18; right:180px; top:135px; width:860px; height:420px; background: linear-gradient(135deg, rgba(240,238,224,.9), rgba(196,214,208,.74)); clip-path: polygon(5% 20%, 100% 0, 96% 100%, 0 92%); box-shadow: inset 0 0 80px rgba(74,88,82,.36), 0 34px 80px rgba(0,0,0,.38); opacity:.82; }
      .courtyard-wall::before { content:""; position:absolute; left:70px; top:-48px; width:790px; height:90px; background: repeating-linear-gradient(90deg, #435861 0 22px, #2e414b 22px 38px); transform: skewX(-12deg); box-shadow: 0 14px 24px rgba(0,0,0,.3); }
      .screen-wall { position:absolute; z-index:20; right:500px; top:235px; width:280px; height:172px; border:8px solid rgba(126,53,37,.72); background: radial-gradient(circle at 50% 42%, rgba(88,139,150,.34), transparent 44%), rgba(240,238,224,.78); box-shadow: inset 0 0 40px rgba(0,0,0,.18); }
      .wood-window { position:absolute; z-index:21; right:285px; top:252px; width:194px; height:150px; border:7px solid rgba(136,63,48,.8); background: repeating-linear-gradient(90deg, transparent 0 25px, rgba(136,63,48,.72) 25px 32px), repeating-linear-gradient(0deg, rgba(246,205,104,.42) 0 24px, rgba(136,63,48,.52) 24px 31px); }
      .stone-floor { position:absolute; z-index:25; inset:auto 0 0 0; height:330px; background: linear-gradient(180deg, rgba(63,53,46,.18), rgba(57,42,35,.78)), repeating-linear-gradient(8deg, rgba(255,255,255,.1) 0 2px, transparent 2px 64px), repeating-linear-gradient(93deg, rgba(0,0,0,.18) 0 3px, transparent 3px 96px); opacity:.72; }
      .warm-haze { position:absolute; z-index:36; left:760px; top:360px; width:720px; height:360px; background: radial-gradient(ellipse, rgba(255,177,94,.28), transparent 68%); filter: blur(22px); }
    `,
    body: `
      <img class="photo child-bg" src="${image("photos/sence1/1a0fbaf177519bb0490055fde45b3c82.jpg")}">
      <img class="photo door-bg" src="${image("photos/sence1/51091af19439881997d8a446254314e5.jpg")}">
      <div class="courtyard-wall"></div><div class="screen-wall"></div><div class="wood-window"></div><div class="stone-floor"></div>
      <div class="warm-haze"></div><div class="spot" style="left:1185px;opacity:.42"></div><div class="platform"></div>${bulbs(6)}
    `
  },
  {
    id: "sence2-halloween-campus",
    out: "sence2-halloween-campus.png",
    css: `
      .scene { --rim: rgba(185,108,255,.84); --glow: rgba(185,108,255,.36); --shine: rgba(255,192,119,.26); --bulb: #ffc879; --bulb-glow: rgba(185,108,255,.66); background: radial-gradient(circle at 72% 62%, rgba(255,127,54,.2), transparent 34%), linear-gradient(180deg,#060508,#17101e 55%,#070406); }
      .selfie { inset:-80px -110px -80px -110px; width:2140px; height:1240px; object-position:37% 41%; filter: blur(9px) saturate(.92) brightness(.65); opacity:.46; }
      .corridor { position:absolute; z-index:16; right:145px; top:180px; width:950px; height:520px; transform: skewX(-10deg); background: linear-gradient(125deg, rgba(33,26,55,.86), rgba(23,16,37,.2) 58%, rgba(255,126,49,.16)); box-shadow: inset 0 0 90px rgba(0,0,0,.42), 0 30px 80px rgba(0,0,0,.38); opacity:.86; }
      .corridor::before { content:""; position:absolute; inset:80px 60px 210px 90px; background: linear-gradient(90deg, rgba(110,73,170,.58), rgba(255,145,66,.18)); filter: blur(18px); }
      .purple-fog { position:absolute; z-index:32; right:150px; top:330px; width:890px; height:470px; background: radial-gradient(ellipse at 42% 52%, rgba(185,108,255,.3), transparent 62%), radial-gradient(ellipse at 82% 76%, rgba(255,126,48,.28), transparent 50%); filter: blur(24px); }
      .pumpkin { position:absolute; z-index:48; right:250px; bottom:190px; width:150px; height:92px; border-radius:50%; background: radial-gradient(ellipse at 50% 36%, #ffad54, #cc5a1e 72%); box-shadow: 0 0 48px rgba(255,126,48,.46); opacity:.78; }
      .pumpkin::before { content:""; position:absolute; left:65px; top:-22px; width:18px; height:36px; border-radius:50%; background:#4e351b; transform:rotate(16deg); }
      .ghost { position:absolute; z-index:35; width:82px; height:92px; border-radius:50% 50% 20% 20%; background:rgba(225,216,255,.36); filter:blur(.2px); }
      .ghost.one { right:690px; top:350px; }
      .ghost.two { right:340px; top:280px; transform:scale(.76); }
    `,
    body: `
      <img class="photo selfie" src="${image("photos/sence2/2c7b6ef66e62b1580398a4e6bd7e682d.jpg")}">
      <div class="corridor"></div><div class="purple-fog"></div><div class="ghost one"></div><div class="ghost two"></div>
      <div class="spot" style="left:1160px;opacity:.47"></div><div class="platform"></div><div class="pumpkin"></div>${bulbs(6)}
    `
  },
  {
    id: "sence3-graduation-lawn",
    out: "sence3-graduation-lawn.png",
    css: `
      .scene { --rim: rgba(116,209,166,.86); --glow: rgba(116,209,166,.32); --shine: rgba(255,242,190,.3); --bulb: #d9ffd6; --bulb-glow: rgba(116,209,166,.62); background: linear-gradient(180deg,#07100d,#10231b 56%,#060807); }
      .grad { inset:-80px -90px -80px -90px; width:2120px; height:1240px; object-position:58% 44%; filter: blur(6px) saturate(1.05) brightness(.78); opacity:.46; }
      .grass { position:absolute; z-index:20; inset:auto 0 0 0; height:460px; background: linear-gradient(180deg, rgba(35,81,47,.08), rgba(18,54,31,.78)), repeating-linear-gradient(96deg, rgba(185,232,136,.13) 0 2px, transparent 2px 14px), repeating-linear-gradient(78deg, rgba(72,135,70,.2) 0 2px, transparent 2px 20px); }
      .sun { position:absolute; z-index:30; right:130px; top:70px; width:620px; height:520px; background: radial-gradient(ellipse, rgba(255,231,156,.4), transparent 68%); filter: blur(28px); }
      .campus-lines { position:absolute; z-index:26; right:260px; top:330px; width:820px; height:260px; opacity:.52; background: linear-gradient(180deg, transparent 0 36%, rgba(240,255,230,.7) 37% 38%, transparent 39% 67%, rgba(240,255,230,.38) 68% 69%, transparent 70%); }
      .flowers { position:absolute; z-index:42; inset:0; opacity:.42; background-image: radial-gradient(circle at 62% 76%, rgba(255,255,240,.85) 0 4px, transparent 5px), radial-gradient(circle at 78% 69%, rgba(255,235,174,.75) 0 3px, transparent 4px), radial-gradient(circle at 86% 83%, rgba(255,255,240,.65) 0 4px, transparent 5px); background-size: 220px 160px, 190px 130px, 260px 180px; }
    `,
    body: `
      <img class="photo grad" src="${image("photos/sence3/eb9ecb0bd1ff455cfdc9132f0877d4b6.jpg")}">
      <div class="sun"></div><div class="grass"></div><div class="campus-lines"></div><div class="flowers"></div>
      <div class="spot" style="left:1130px;opacity:.36"></div><div class="platform"></div>${bulbs(6)}
    `
  },
  {
    id: "sence4-kunming-film-street",
    out: "sence4-kunming-film-street.png",
    css: `
      .scene { --rim: rgba(255,156,115,.86); --glow: rgba(255,156,115,.34); --shine: rgba(255,222,190,.32); --bulb: #ffd1a0; --bulb-glow: rgba(111,199,216,.56); background: linear-gradient(180deg,#050506,#151111 54%,#060505); }
      .film { inset:-70px -80px -70px -80px; width:2080px; height:1220px; object-position:48% 48%; filter: blur(8px) saturate(.9) brightness(.64); opacity:.58; }
      .stone { inset:-30px -60px -60px -80px; width:2080px; height:1180px; object-position:46% 42%; filter: blur(4px) saturate(.78) brightness(.42); opacity:.3; mix-blend-mode:screen; }
      .wet-street { position:absolute; z-index:24; inset:auto 0 0 0; height:360px; background: linear-gradient(180deg, rgba(20,14,14,0), rgba(20,12,11,.86)), repeating-linear-gradient(172deg, rgba(255,255,255,.06) 0 3px, transparent 3px 38px); box-shadow: inset 0 90px 110px rgba(0,0,0,.38); }
      .light-leak { position:absolute; z-index:34; right:0; top:120px; width:780px; height:780px; background: radial-gradient(ellipse at 42% 46%, rgba(255,157,106,.36), transparent 54%), radial-gradient(ellipse at 74% 72%, rgba(111,199,216,.28), transparent 48%); filter: blur(20px); mix-blend-mode:screen; }
      .string-light { position:absolute; z-index:40; right:210px; top:260px; width:780px; height:120px; border-top:2px solid rgba(255,209,160,.34); transform:rotate(-7deg); }
      .string-light span { position:absolute; top:-7px; width:12px; height:12px; border-radius:50%; background:#ffd1a0; box-shadow:0 0 18px #ff9c73; }
    `,
    body: `
      <img class="photo film" src="${image("photos/sence4/2.jpg")}">
      <img class="photo stone" src="${image("photos/sence4/1.jpg")}">
      <div class="wet-street"></div><div class="light-leak"></div>
      <div class="string-light">${Array.from({ length: 12 }, (_, i) => `<span style="left:${i * 62}px;top:${Math.sin(i) * 12 - 6}px"></span>`).join("")}</div>
      <div class="spot" style="left:1168px;opacity:.38"></div><div class="platform"></div>${bulbs(6)}
    `
  },
  {
    id: "sence6-tibet-plateau",
    out: "sence6-tibet-plateau.png",
    css: `
      .scene { --rim: rgba(107,183,255,.86); --glow: rgba(107,183,255,.32); --shine: rgba(235,244,255,.3); --bulb: #d7ecff; --bulb-glow: rgba(107,183,255,.58); background: linear-gradient(180deg,#06101b,#152232 56%,#07080a); }
      .plateau { inset:-80px -120px -80px -120px; width:2160px; height:1240px; object-position:58% 44%; filter: blur(7px) saturate(.92) brightness(.68); opacity:.54; }
      .wheels { inset:-40px -80px -80px -60px; width:2080px; height:1180px; object-position:55% 44%; filter: blur(3px) saturate(.9) brightness(.52); opacity:.48; mix-blend-mode:screen; }
      .sky-glow { position:absolute; z-index:26; right:120px; top:60px; width:820px; height:560px; background: radial-gradient(ellipse at 58% 32%, rgba(185,221,255,.34), transparent 62%); filter: blur(18px); }
      .stone-floor { position:absolute; z-index:24; inset:auto 0 0 0; height:380px; background: linear-gradient(180deg, rgba(20,28,34,0), rgba(16,24,31,.82)), repeating-linear-gradient(12deg, rgba(255,255,255,.08) 0 2px, transparent 2px 70px), repeating-linear-gradient(92deg, rgba(0,0,0,.22) 0 3px, transparent 3px 110px); }
      .flags { position:absolute; z-index:38; right:230px; top:310px; width:820px; height:160px; border-top:3px solid rgba(255,247,214,.66); transform:rotate(6deg); filter: drop-shadow(0 10px 16px rgba(0,0,0,.34)); }
      .flags span { position:absolute; top:0; width:26px; height:58px; clip-path: polygon(0 0,100% 0,100% 72%,50% 100%,0 72%); }
      .wind { position:absolute; z-index:37; right:360px; top:300px; width:740px; height:320px; border:3px solid rgba(214,235,255,.18); border-left:0; border-bottom:0; border-radius:50%; filter:blur(.4px); transform:rotate(-10deg); }
    `,
    body: `
      <img class="photo plateau" src="${image("photos/sence6/78720d4affcbe16b30b8f3932ac81ac5.jpg")}">
      <img class="photo wheels" src="${image("photos/sence6/5ad6a40732733000ab60899abbc7a2e1.jpg")}">
      <div class="sky-glow"></div><div class="stone-floor"></div>
      <div class="flags">${Array.from({ length: 13 }, (_, i) => {
        const colors = ["#4ea5ff", "#f5dba0", "#e85045", "#56c081", "#ffffff"];
        return `<span style="left:${i * 58}px;background:${colors[i % colors.length]}"></span>`;
      }).join("")}</div>
      <div class="wind"></div><div class="spot" style="left:1175px;opacity:.46"></div><div class="platform"></div>${bulbs(6)}
    `
  }
];

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });

for (const scene of scenes) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${sharedStyle}${scene.css}</style></head><body><div class="scene">${scene.body}<div class="dust"></div><div class="left-mask"></div><div class="grain"></div><div class="vignette"></div></div></body></html>`;
  await page.setContent(html, { waitUntil: "load" });
  await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete && img.naturalWidth > 0));
  await page.locator(".scene").screenshot({ path: path.join(outputDir, scene.out) });
}

await browser.close();
console.log(`Generated ${scenes.length} scene backgrounds in ${outputDir}`);
