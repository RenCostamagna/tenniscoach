"use client"

import { useMemo } from "react"

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  className?: string
}

export function Sparkline({ data, width = 100, height = 30, color = "#3b82f6", className = "" }: SparklineProps) {
  const path = useMemo(() => {
    if (data.length < 2) return ""

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })

    return `M ${points.join(" L ")}`
  }, [data, width, height])

  if (data.length < 2) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <span className="text-xs text-gray-400">No data</span>
      </div>
    )
  }

  return (
    <svg width={width} height={height} className={className}>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
