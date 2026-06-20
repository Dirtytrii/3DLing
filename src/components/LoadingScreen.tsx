interface LoadingScreenProps {
  ready: boolean;
}

export function LoadingScreen({ ready }: LoadingScreenProps) {
  return (
    <div className={`loading-screen ${ready ? "is-leaving" : ""}`} role="status" aria-live="polite" aria-busy={!ready}>
      <div className="loading-scene">
        <div className="loading-photo-stack" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="loading-stage" aria-hidden="true">
          <span className="loading-beam" />
          <span className="loading-platform" />
          <span className="loading-toy" />
          <span className="loading-bulb loading-bulb-one" />
          <span className="loading-bulb loading-bulb-two" />
          <span className="loading-bulb loading-bulb-three" />
        </div>
      </div>

      <div className="loading-copy">
        <p className="loading-kicker">3Dling</p>
        <p className="loading-title">正在布置这一幕</p>
      </div>
    </div>
  );
}
