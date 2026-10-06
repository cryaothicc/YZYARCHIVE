export function albumIndex(slide: number, count: number) {
  return ((slide % count) + count) % count;
}

export function loopDistance(snap: number, progress: number, count: number) {
  const difference = snap - progress;
  return (difference - Math.round(difference)) * count;
}
