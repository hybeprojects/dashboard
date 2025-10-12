import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, TooltipProps } from 'recharts';

function CurrencyTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null;
  const v = payload[0].value as number;
  return (
    <div className="rounded-md bg-white dark:bg-gray-900 px-3 py-2 shadow border border-gray-200 dark:border-gray-800 text-sm">
      <div className="font-medium">{label}</div>
      <div className="text-primary">${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
    </div>
  );
}

export default function OverviewChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-64" role="img" aria-label="Monthly cashflow area chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="color" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip content={<CurrencyTooltip />} />
          <Area type="monotone" dataKey="value" stroke="#1e40af" fillOpacity={1} fill="url(#color)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
