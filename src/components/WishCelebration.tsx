import type { CSSProperties } from "react";

interface Props { x: number; y: number; artHeight: number }

const starPath = "m12 1.8 3 6.3 7 .9-5.1 4.9 1.3 6.9-6.2-3.3-6.2 3.3 1.3-6.9L2 9l7-.9Z";
const particles = Array.from({ length: 64 }, (_, index) => {
  const angle = ((index * 137.508) % 360) * Math.PI / 180;
  const distance = 0.22 + ((index * 7) % 17) / 100;
  return {
    star: index < 28,
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance * .72 - .1,
    delay: (index % 7) * 35,
    duration: 2150 + (index % 5) * 120,
    turn: (index % 2 ? 1 : -1) * (70 + index * 11),
    size: index < 28 ? 12 + (index % 4) * 4 : 7 + index % 4
  };
});

/** A short, local celebration around the cake; no extra canvas or render loop. */
export function WishCelebration({ x, y, artHeight }: Props) {
  return (
    <div className="wish-effects" style={{ left: x, top: y, "--wish-unit": `${artHeight}px` } as CSSProperties} aria-hidden="true">
      <svg className="candle-smoke" viewBox="0 0 100 160" fill="none" strokeLinecap="round">
        <path d="M49 154c-12-20 22-29 12-49S30 87 45 67s28-32 13-54" />
        <path d="M50 154c12-22-19-29-11-50s28-24 20-45S36 36 47 8" />
        <path d="M50 153c-3-22 20-38 8-55S32 70 47 47" />
      </svg>
      <div className="cake-burst">
        <span className="wish-halo" />
        <span className="wish-ring" />
        {particles.map((particle, index) => {
          const dx = particle.x * artHeight, dy = particle.y * artHeight;
          const style = {
            "--dx": `${dx}px`, "--dy": `${dy + artHeight * .15}px`,
            "--apex-x": `${dx * .72}px`, "--apex-y": `${dy - artHeight * .055}px`,
            "--turn": `${particle.turn}deg`, "--delay": `${particle.delay}ms`,
            "--duration": `${particle.duration}ms`, "--size": `${particle.size * artHeight / 900}px`
          } as CSSProperties;
          return <span className={`wish-particle ${particle.star ? "is-star" : "is-confetti"}`} key={index} style={style}>
            {particle.star && <svg viewBox="0 0 24 24"><path d={starPath} /></svg>}
          </span>;
        })}
      </div>
    </div>
  );
}
