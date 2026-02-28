/**
 * Line Chart for burndown/burnup visualization
 * Uses SVG for simple, responsive line charts without external dependencies
 */

import { useMemo } from "react";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";

interface DataPoint {
  label: string;
  value: number;
  idealValue?: number;
}

interface LineChartProps {
  data: DataPoint[];
  color?: string;
  idealColor?: string;
  height?: number;
  showIdealLine?: boolean;
}

export function LineChart({
  data,
  color = "var(--color-brand)",
  idealColor = "var(--color-ui-border)",
  height = 200,
  showIdealLine = true,
}: LineChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return null;

    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const maxValue = Math.max(...data.map((d) => Math.max(d.value, d.idealValue ?? 0)), 1);

    // Calculate chart dimensions
    const chartHeight = height - padding.top - padding.bottom;

    // Generate path for actual data
    const xStep =
      (100 - ((padding.left + padding.right) / 400) * 100) / Math.max(data.length - 1, 1);
    const startX = (padding.left / 400) * 100;

    const actualPath = data
      .map((point, i) => {
        const x = startX + i * xStep;
        const y = padding.top + chartHeight * (1 - point.value / maxValue);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    // Generate path for ideal line
    const idealPath = data
      .map((point, i) => {
        if (point.idealValue === undefined) return null;
        const x = startX + i * xStep;
        const y = padding.top + chartHeight * (1 - point.idealValue / maxValue);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .filter(Boolean)
      .join(" ");

    // Generate points for actual data
    const actualPoints = data.map((point, i) => ({
      x: startX + i * xStep,
      y: padding.top + chartHeight * (1 - point.value / maxValue),
      label: point.label,
      value: point.value,
    }));

    // Y-axis labels
    const yLabels = [0, Math.round(maxValue / 2), maxValue];

    return {
      actualPath,
      idealPath,
      actualPoints,
      yLabels,
      padding,
      chartHeight,
      maxValue,
    };
  }, [data, height]);

  if (!chartData || data.length === 0) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <Typography variant="small" color="secondary">
          No data available
        </Typography>
      </Flex>
    );
  }

  const { actualPath, idealPath, actualPoints, yLabels, padding, chartHeight } = chartData;

  return (
    <svg
      width="100%"
      height={height}
      className="overflow-visible"
      role="img"
      aria-label="Line chart"
    >
      {/* Y-axis labels */}
      {yLabels.map((label) => {
        const y = padding.top + chartHeight * (1 - label / chartData.maxValue);
        return (
          <text
            key={label}
            x={padding.left - 8}
            y={y}
            textAnchor="end"
            alignmentBaseline="middle"
            className="fill-ui-text-secondary text-caption"
          >
            {label}
          </text>
        );
      })}

      {/* Grid lines */}
      {yLabels.map((label) => {
        const y = padding.top + chartHeight * (1 - label / chartData.maxValue);
        return (
          <line
            key={`grid-${label}`}
            x1={`${(padding.left / 400) * 100}%`}
            x2="95%"
            y1={y}
            y2={y}
            stroke="var(--color-ui-border)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        );
      })}

      {/* Ideal line */}
      {showIdealLine && idealPath && (
        <path d={idealPath} fill="none" stroke={idealColor} strokeWidth="2" strokeDasharray="6 4" />
      )}

      {/* Actual line */}
      <path
        d={actualPath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {actualPoints.map((point, index) => (
        <g key={`point-${point.label}`}>
          <circle
            cx={`${point.x}%`}
            cy={point.y}
            r="4"
            fill={color}
            className="transition-default"
          />
          {/* X-axis labels (show every other for space) */}
          {(index === 0 || index === actualPoints.length - 1 || index % 2 === 0) && (
            <text
              x={`${point.x}%`}
              y={height - 8}
              textAnchor="middle"
              className="fill-ui-text-secondary text-caption"
            >
              {point.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
