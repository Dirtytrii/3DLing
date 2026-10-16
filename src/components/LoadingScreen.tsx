import { useEffect, useState, type CSSProperties } from "react";
import { gift } from "../data/gift";

interface Props { completed: number; total: number; failed: number; leaving: boolean; onRetry: () => void }
const stars = [{ x: 14, y: 25, delay: 0 }, { x: 83, y: 20, delay: 1.2 }, { x: 88, y: 42, delay: 2.1 }, { x: 24, y: 58, delay: .7 }];

export function LoadingScreen({ completed, total, failed, leaving, onRetry }: Props) {
  const [artReady, setArtReady] = useState(false);
  const percent = Math.floor(completed / total * 100);
  useEffect(() => { document.getElementById("gift-loading-title")?.focus({ preventScroll: true }); }, []);
  return (
    <div className={`loading-screen ${artReady ? "has-art" : ""} ${leaving ? "is-leaving" : ""}`} data-loading-state={failed ? "error" : leaving ? "leaving" : "preparing"}>
      <img className="loading-art" src={gift.art.loading} alt="" aria-hidden="true" fetchPriority="high" onLoad={() => setArtReady(true)} />
      <span className="wordmark loading-wordmark" aria-hidden="true">Ling<span>✦</span></span>
      <div className="loading-starlight" aria-hidden="true">{stars.map((star, index) => <i key={index} style={{ left: `${star.x}%`, top: `${star.y}%`, "--twinkle-delay": `${star.delay}s` } as CSSProperties}>✦</i>)}</div>
      <div className="loading-copy">
        <h1 id="gift-loading-title" tabIndex={-1}>把回忆，装进礼物。</h1>
        <p role="status">{failed ? "有几份美好还没送达，再试一次。" : leaving ? "都准备好了，送给你。" : "美好正在慢慢就位"}</p>
        <div className="loading-progress" role="progressbar" aria-label="礼物准备进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <div className="loading-progress-fill" style={{ width: `${percent}%` }}><span aria-hidden="true">✦</span></div>
        </div>
        <span className="loading-percent" aria-hidden="true">{percent}<small>%</small></span>
        {failed > 0 && <button className="loading-retry text-link" type="button" onClick={onRetry}>重新准备 <span aria-hidden="true">↻</span></button>}
      </div>
    </div>
  );
}
