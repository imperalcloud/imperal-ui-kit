'use client';

import React, { useId } from 'react';
import { Bar, BarChart, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ChartDataPoint, UIComponent } from '../types';
import { useImperalUI } from '../ImperalUIProvider';

type ChartType = 'line' | 'bar' | 'pie';
const PALETTE = ['var(--imp-blue-500)', 'var(--imp-green-500)', 'var(--imp-purple-500)', 'var(--imp-amber-500)', 'var(--imp-red-500)', 'var(--imp-cyan-500)', 'var(--imp-orange-500)', 'var(--imp-pink-500)'];
const TOOLTIP_STYLE = { backgroundColor: 'var(--imp-color-surface-2)', border: '.0625rem solid var(--imp-color-border)', borderRadius: 'var(--imp-radius-md)', color: 'var(--imp-color-text)', fontSize: '.75rem' };
const AXIS_STYLE = { fill: 'var(--imp-color-text-subtle)', fontSize: '.6875rem' };

export const DChart: UIComponent = ({ node }) => {
  const ui = useImperalUI();
  const {
    chart_type = 'line', data = [], series = [], height = 200, x_key = 'name', show_legend = false,
    y2_keys = [], title = 'Chart', description = '', show_data_table = false,
  } = node.props as {
    chart_type?: ChartType; data?: ChartDataPoint[]; series?: { key: string; label?: string; color?: string }[];
    height?: number | string; x_key?: string; show_legend?: boolean; y2_keys?: string[];
    title?: string; description?: string; show_data_table?: boolean;
  };
  const titleId = useId();
  const descriptionId = useId();
  const y2Set = React.useMemo(() => new Set(y2_keys), [y2_keys]);
  const resolvedSeries = series.length ? series : data.length ? Object.keys(data[0]).filter(key => key !== x_key).map((key, index) => ({ key, label: key, color: PALETTE[index % PALETTE.length] })) : [];
  const safeHeight = typeof height === 'number' ? `clamp(12rem, ${Math.max(20, Math.min(70, height / 5))}vw, ${Math.max(12, height / 16)}rem)` : height;

  if (!data.length) return <div role="status" className="surface flex min-h-48 items-center justify-center text-sm text-muted">{ui.messages.noData}</div>;
  const chartProps = { data, margin: { top: 4, right: 8, left: -16, bottom: 0 } };
  const dataTable = (
    <div className={show_data_table ? 'mt-3 overflow-x-auto' : 'sr-only'}>
      <table>
        <caption>{title} data</caption>
        <thead><tr><th scope="col">{x_key}</th>{resolvedSeries.map(item => <th scope="col" key={item.key}>{item.label ?? item.key}</th>)}</tr></thead>
        <tbody>{data.map((row, index) => <tr key={`${String(row[x_key])}-${index}`}><th scope="row">{String(row[x_key] ?? '')}</th>{resolvedSeries.map(item => <td key={item.key}>{String(row[item.key] ?? '')}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );

  return (
    <figure aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} className="min-w-0">
      <figcaption id={titleId} className="sr-only">{title}</figcaption>
      {description && <p id={descriptionId} className="sr-only">{description}</p>}
      <div role="img" aria-label={`${title}. ${data.length} data points.`} style={{ height: safeHeight, minHeight: '12rem', maxHeight: '70dvh' }}>
        <ResponsiveContainer width="100%" height="100%">
          {chart_type === 'pie' ? <PieChart><Pie data={data} dataKey={resolvedSeries[0]?.key ?? 'value'} nameKey={x_key} cx="50%" cy="50%" outerRadius="70%" label labelLine={false}>{data.map((_, index) => <Cell key={index} fill={PALETTE[index % PALETTE.length]} />)}</Pie><Tooltip contentStyle={TOOLTIP_STYLE} />{show_legend && <Legend />}</PieChart>
          : chart_type === 'bar' ? <BarChart {...chartProps}><XAxis dataKey={x_key} tick={AXIS_STYLE} axisLine={false} tickLine={false} /><YAxis yAxisId="left" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={40} />{y2Set.size > 0 && <YAxis yAxisId="right" orientation="right" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={40} />}<Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'color-mix(in srgb, var(--imp-color-text) 4%, transparent)' }} />{show_legend && <Legend />}{resolvedSeries.map((item, index) => <Bar key={item.key} dataKey={item.key} name={item.label ?? item.key} yAxisId={y2Set.has(item.key) ? 'right' : 'left'} fill={item.color ?? PALETTE[index % PALETTE.length]} radius={[3, 3, 0, 0]} />)}</BarChart>
          : <LineChart {...chartProps}><XAxis dataKey={x_key} tick={AXIS_STYLE} axisLine={false} tickLine={false} /><YAxis yAxisId="left" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={40} />{y2Set.size > 0 && <YAxis yAxisId="right" orientation="right" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={40} />}<Tooltip contentStyle={TOOLTIP_STYLE} />{show_legend && <Legend />}{resolvedSeries.map((item, index) => <Line key={item.key} type="monotone" dataKey={item.key} name={item.label ?? item.key} yAxisId={y2Set.has(item.key) ? 'right' : 'left'} stroke={item.color ?? PALETTE[index % PALETTE.length]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />)}</LineChart>}
        </ResponsiveContainer>
      </div>
      {dataTable}
    </figure>
  );
};
