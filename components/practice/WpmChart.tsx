"use client"

import { useMemo } from "react"
import { WpmDataPoint } from "@/lib/stores/gameStore"

interface WpmChartProps {
  data: WpmDataPoint[]
  width?: number
  height?: number
}

export function WpmChart({ data, width = 600, height = 200 }: WpmChartProps) {
  const { path, points, maxWpm, minWpm } = useMemo(() => {
    if (data.length < 2) {
      return { path: "", points: [], maxWpm: 100, minWpm: 0 }
    }

    const wpmValues = data.map(d => d.wpm)
    const maxWpm = Math.max(...wpmValues, 50)
    const minWpm = Math.min(...wpmValues, 0)
    const range = maxWpm - minWpm || 1

    const padding = { top: 20, right: 20, bottom: 30, left: 40 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const maxTime = data[data.length - 1].time

    const points = data.map((point, i) => ({
      x: padding.left + (point.time / maxTime) * chartWidth,
      y: padding.top + chartHeight - ((point.wpm - minWpm) / range) * chartHeight,
      wpm: point.wpm,
      time: point.time,
    }))

    const pathData = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ")

    return { path: pathData, points, maxWpm, minWpm }
  }, [data, width, height])

  if (data.length < 2) {
    return (
      <div 
        className="flex items-center justify-center text-[#666]"
        style={{ width, height }}
      >
        Not enough data to display chart
      </div>
    )
  }

  const padding = { top: 20, right: 20, bottom: 30, left: 40 }

  return (
    <svg width={width} height={height} className="overflow-visible">
      <line
        x1={padding.left}
        y1={height - padding.bottom}
        x2={width - padding.right}
        y2={height - padding.bottom}
        stroke="#333"
        strokeWidth={1}
      />
      <line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={height - padding.bottom}
        stroke="#333"
        strokeWidth={1}
      />

      <text
        x={padding.left - 10}
        y={padding.top}
        fill="#666"
        fontSize={10}
        textAnchor="end"
        dominantBaseline="middle"
      >
        {Math.round(maxWpm)}
      </text>
      <text
        x={padding.left - 10}
        y={height - padding.bottom}
        fill="#666"
        fontSize={10}
        textAnchor="end"
        dominantBaseline="middle"
      >
        {Math.round(minWpm)}
      </text>

      <text
        x={width / 2}
        y={height - 5}
        fill="#666"
        fontSize={10}
        textAnchor="middle"
      >
        Time (seconds)
      </text>

      <defs>
        <linearGradient id="wpmGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity={0.2} />
          <stop offset="100%" stopColor="white" stopOpacity={0} />
        </linearGradient>
      </defs>

      {points.length > 1 && (
        <path
          d={`${path} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`}
          fill="url(#wpmGradient)"
        />
      )}

      <path
        d={path}
        fill="none"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {points.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r={3}
          fill="black"
          stroke="white"
          strokeWidth={2}
        />
      ))}
    </svg>
  )
}
