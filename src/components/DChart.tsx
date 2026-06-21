'use client';

import React from 'react';
import {
  LineChart,
  BarChart,
  PieChart,
  Line,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { UIComponent, ChartDataPoint } from '../types';

type ChartType = 'line' | 'bar' | 'pie';

const PALETTE = [
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#a855f7', // purple-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
];

const TOOLTIP_STYLE = {
  backgroundColor: 'rgb(17 24 39)',
  border: '1px solid rgb(55 65 81 / 0.5)',
  borderRadius: '6px',
  color: '#e5e7eb',
  fontSize: '12px',
};

const AXIS_STYLE = { fill: '#6b7280', fontSize: 11 };

export const DChart: UIComponent = ({ node }) => {
  const {
    chart_type = 'line',
    data = [],
    series = [],
    height = 200,
    x_key = 'name',
    show_legend = false,
    show_grid = false,
    y2_keys = [],
  } = node.props as {
    chart_type?: ChartType;
    data?: ChartDataPoint[];
    series?: { key: string; label?: string; color?: string }[];
    height?: number;
    x_key?: string;
    show_legend?: boolean;
    show_grid?: boolean;
    y2_keys?: string[];
  };

  const y2Set = React.useMemo(() => new Set(y2_keys), [y2_keys]);
  const hasY2 = y2Set.size > 0;

  // Auto-detect series from data keys if not provided
  const resolvedSeries =
    series.length > 0
      ? series
      : data.length > 0
      ? Object.keys(data[0])
          .filter((k) => k !== x_key)
          .map((k, i) => ({ key: k, label: k, color: PALETTE[i % PALETTE.length] }))
      : [];

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-800/30 rounded-lg border border-gray-800/50 text-sm text-gray-600"
        style={{ height }}
      >
        No data
      </div>
    );
  }

  const chartProps = {
    data,
    margin: { top: 4, right: 8, left: -16, bottom: 0 },
  };

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {chart_type === 'pie' ? (
          <PieChart>
            <Pie
              data={data}
              dataKey={resolvedSeries[0]?.key ?? 'value'}
              nameKey={x_key}
              cx="50%"
              cy="50%"
              outerRadius="70%"
              label
              labelLine={false}
            >
              {data.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={PALETTE[idx % PALETTE.length]}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            {show_legend && <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />}
          </PieChart>
        ) : chart_type === 'bar' ? (
          <BarChart {...chartProps}>
            <XAxis dataKey={x_key} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={40} />
            {hasY2 && (
              <YAxis yAxisId="right" orientation="right" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={40} />
            )}
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgb(255 255 255 / 0.04)' }} />
            {show_legend && <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />}
            {resolvedSeries.map((s, idx) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label ?? s.key}
                yAxisId={y2Set.has(s.key) ? 'right' : 'left'}
                fill={s.color ?? PALETTE[idx % PALETTE.length]}
                radius={[3, 3, 0, 0]}
              />
            ))}
          </BarChart>
        ) : (
          // Default: line
          <LineChart {...chartProps}>
            <XAxis dataKey={x_key} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={40} />
            {hasY2 && (
              <YAxis yAxisId="right" orientation="right" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={40} />
            )}
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            {show_legend && <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />}
            {resolvedSeries.map((s, idx) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label ?? s.key}
                yAxisId={y2Set.has(s.key) ? 'right' : 'left'}
                stroke={s.color ?? PALETTE[idx % PALETTE.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};
