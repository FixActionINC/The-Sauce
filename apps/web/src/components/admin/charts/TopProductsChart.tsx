"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TopProductData {
  name: string;
  revenue: number;
  quantity: number;
}

interface TopProductsChartProps {
  data: TopProductData[];
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "\u2026" : str;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: TopProductData }[];
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-surface-overlay bg-surface-elevated px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-text-primary">{item.name}</p>
      <p className="mt-1 text-sm font-semibold text-brand-orange">
        ${item.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <p className="text-xs text-text-secondary">
        {item.quantity} unit{item.quantity !== 1 ? "s" : ""} sold
      </p>
    </div>
  );
}

export default function TopProductsChart({ data }: TopProductsChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-text-secondary">
        No data yet
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    shortName: truncate(d.name, 20),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: "#888", fontSize: 11 }}
          axisLine={{ stroke: "#333" }}
          tickLine={false}
          tickFormatter={(v: number) => `$${v}`}
        />
        <YAxis
          type="category"
          dataKey="shortName"
          tick={{ fill: "#888", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="revenue"
          fill="#E85D24"
          radius={[0, 4, 4, 0]}
          barSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
