'use client'

interface BadgeChartProps {
  dates: string[] // ISO 8601 timestamps, one per badge
}

export default function BadgeChart({ dates }: BadgeChartProps) {
  if (!dates || dates.length === 0) return null

  const parsed = dates
    .map(d => new Date(d).getTime())
    .filter(t => !isNaN(t))
    .sort((a, b) => a - b)

  if (parsed.length === 0) return null

  const minTime = parsed[0]
  const maxTime = parsed[parsed.length - 1]
  const span = maxTime - minTime || 1

  const width = 600
  const height = 180
  const padding = { top: 16, right: 16, bottom: 28, left: 36 }
  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom

  // Build cumulative points
  const points = parsed.map((t, i) => {
    const x = padding.left + ((t - minTime) / span) * plotW
    const y = padding.top + plotH - ((i + 1) / parsed.length) * plotH
    return { x, y }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padding.top + plotH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padding.top + plotH).toFixed(1)} Z`

  // Year tick marks
  const startYear = new Date(minTime).getFullYear()
  const endYear = new Date(maxTime).getFullYear()
  const years: number[] = []
  for (let y = startYear; y <= endYear; y++) years.push(y)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* Y-axis gridlines + labels */}
      {[0, 0.5, 1].map(frac => {
        const y = padding.top + plotH - frac * plotH
        const label = Math.round(frac * parsed.length)
        return (
          <g key={frac}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--border)" strokeWidth={1} />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize={10} fill="var(--fg-3)">{label}</text>
          </g>
        )
      })}

      {/* X-axis year ticks */}
      {years.map(year => {
        const t = new Date(year, 0, 1).getTime()
        if (t < minTime || t > maxTime) return null
        const x = padding.left + ((t - minTime) / span) * plotW
        return (
          <g key={year}>
            <line x1={x} y1={padding.top} x2={x} y2={padding.top + plotH} stroke="var(--border)" strokeWidth={1} strokeDasharray="2,3" />
            <text x={x} y={height - 8} textAnchor="middle" fontSize={10} fill="var(--fg-3)">{year}</text>
          </g>
        )
      })}

      {/* Area fill */}
      <path d={areaPath} fill="var(--accent-glow)" stroke="none" />
      {/* Line */}
      <path d={linePath} fill="none" stroke="var(--accent-2)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
