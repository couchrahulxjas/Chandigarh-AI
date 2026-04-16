export function reconstructPath(cameFrom: Int32Array, start: number, goal: number) {
  if (start === goal) return [start];
  if (cameFrom[goal] === -1) return [];
  const path: number[] = [];
  let cur = goal;
  while (cur !== -1 && cur !== start) {
    path.push(cur);
    cur = cameFrom[cur];
  }
  if (cur === start) path.push(start);
  path.reverse();
  return path;
}

