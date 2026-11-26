const SIZE = 25;

function bits(seed: string) {
  let h = 2166136261;
  for (const char of seed) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) % 100 < 48;
  };
}

function inFinder(x: number, y: number) {
  const corners = [
    [0, 0],
    [SIZE - 7, 0],
    [0, SIZE - 7],
  ];
  return corners.some(([cx, cy]) => x >= cx - 1 && x <= cx + 7 && y >= cy - 1 && y <= cy + 7);
}

/* Visual stand-in for a QR label; encodes nothing. */
export function QrCode({ value, size = 168 }: { value: string; size?: number }) {
  const next = bits(value);
  const cells: [number, number][] = [];
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (!inFinder(x, y) && next()) cells.push([x, y]);
    }
  }
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="#0b1b2e" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="#0b1b2e" />
    </g>
  );
  return (
    <svg viewBox={`-2 -2 ${SIZE + 4} ${SIZE + 4}`} width={size} height={size} role="img" aria-label={`QR label for ${value}`} shapeRendering="crispEdges" className="rounded-md bg-white">
      <rect x={-2} y={-2} width={SIZE + 4} height={SIZE + 4} fill="#fff" />
      {cells.map(([x, y]) => (
        <rect key={`${x}.${y}`} x={x} y={y} width={1} height={1} fill="#0b1b2e" />
      ))}
      {finder(0, 0)}
      {finder(SIZE - 7, 0)}
      {finder(0, SIZE - 7)}
    </svg>
  );
}
