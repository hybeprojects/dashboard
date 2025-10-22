import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, TooltipProps } from 'recharts';
const COLORS = ['#1e3a8a', '#2563eb', '#0ea5a5', '#f59e0b'];

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-md bg-white dark:bg-gray-900 px-3 py-2 shadow border border-gray-200 dark:border-gray-800 text-sm">
      <div className="font-medium">{item.name}</div>
      <div className="text-primary">${(item.value as number).toLocaleString()}</div>
    </div>
  );
}

export default function DonutChart({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="h-64" role="img" aria-label="Spending breakdown donut chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<DonutTooltip />} />
          <Legend
            formatter={(value, _entry, index) => {
              const v = data[index]?.value ?? 0;
              const pct = total ? Math.round((v / total) * 100) : 0;
              return `${value} • ${pct}%`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
