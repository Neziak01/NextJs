/** Courbe d'activité des 60 dernières minutes, en SVG inline (aucune lib de charts). */
export function Pulse({ points, height = 56 }: { points: { bucket: number; count: number }[]; height?: number }) {
  if (points.length < 2) {
    return <div className="px-4 py-6 text-xs text-[var(--muted)]">Pas encore assez d&apos;activité.</div>;
  }

  const width = 600;
  const max = Math.max(1, ...points.map((p) => p.count));
  const step = width / (points.length - 1);
  const y = (count: number) => height - (count / max) * (height - 6) - 3;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y(p.count).toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <div className="px-4 py-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-14 w-full"
        role="img"
        aria-label={`Activité des agents : pic à ${max} événements par minute`}
      >
        <defs>
          <linearGradient id="pulse-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#pulse-fill)" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-[var(--muted)]">
        <span>-60 min</span>
        <span>pic {max}/min</span>
        <span>maintenant</span>
      </div>
    </div>
  );
}
