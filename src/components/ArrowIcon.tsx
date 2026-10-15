type Direction = "right" | "left" | "down" | "up" | "up-right" | "replay";

export function ArrowIcon({ direction = "right" }: { direction?: Direction }) {
  const rotation = { right: 0, left: 180, down: 90, up: -90, "up-right": -45, replay: 0 }[direction];
  return <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {direction === "replay" ? <path d="M4 10a8 8 0 1 1 2 8M4 4v6h6" /> : <path d="M4 12h16m-6-6 6 6-6 6" transform={`rotate(${rotation} 12 12)`} />}
  </svg>;
}
