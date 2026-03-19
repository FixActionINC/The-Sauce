"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface CategoryData {
  category: string;
  revenue: number;
}

interface CategoryChartProps {
  data: CategoryData[];
}

const CATEGORY_COLORS: Record<string, string> = {
  original: "#E85D24",
  hot: "#C41E1E",
  mild: "#E7B261",
  "limited-edition": "#8B5CF6",
  bundle: "#10B981",
  Other: "#6B7280",
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other;
}

function formatCategoryLabel(category: string): string {
  return category
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: CategoryData & { percent: number } }[];
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-surface-overlay bg-surface-elevated px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-text-primary">
        {formatCategoryLabel(item.category)}
      </p>
      <p className="mt-1 text-sm font-semibold" style={{ color: getCategoryColor(item.category) }}>
        ${item.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

function CustomLegend({
  payload,
}: {
  payload?: { value: string; color: string }[];
}) {
  if (!payload?.length) return null;

  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-text-secondary">
            {formatCategoryLabel(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function CategoryChart({ data }: CategoryChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-text-secondary">
        No data yet
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.revenue, 0);

  const chartData = data.map((d) => ({
    ...d,
    percent: total > 0 ? Math.round((d.revenue / total) * 100) : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="revenue"
          nameKey="category"
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          label={({ percent }) => `${percent}%`}
          labelLine={false}
        >
          {chartData.map((entry) => (
            <Cell
              key={entry.category}
              fill={getCategoryColor(entry.category)}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
