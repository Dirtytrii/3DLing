/** Exactly mirrors object-fit/background-size: cover with center positioning. */
export function coverPoint(width: number, height: number, aspect: number, x: number, y: number) {
  const artHeight = Math.max(height, width / aspect);
  const artWidth = artHeight * aspect;
  return {
    x: (width - artWidth) / 2 + x * artWidth,
    y: (height - artHeight) / 2 + y * artHeight,
    artHeight,
    artWidth
  };
}
