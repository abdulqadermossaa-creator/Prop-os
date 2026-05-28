import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", revenue: 85000 },
  { month: "Feb", revenue: 92000 },
  { month: "Mar", revenue: 88000 },
  { month: "Apr", revenue: 105000 },
  { month: "May", revenue: 112000 },
  { month: "Jun", revenue: 120000 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-panel-light border border-blue/20 rounded-xl px-4 py-3 shadow-glow">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-white">
          {payload[0].value.toLocaleString()} SAR
        </p>
      </div>
    );
  }
  return null;
};

export default function RevenueChart() {
  return (
    <div className="bg-panel border border-blue/10 rounded-2xl p-5 animate-fadeIn">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-white">Revenue Overview</h3>
          <p className="text-xs text-gray-500 mt-0.5">Last 6 months</p>
        </div>
        <span className="text-xs text-success bg-success/10 border border-success/20 px-2.5 py-1 rounded-full">
          +12.4% YTD
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2F80FF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2F80FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="month"
            tick={{ fill: "#6B7280", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#6B7280", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v / 1000}K`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(47,128,255,0.2)" }} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#2F80FF"
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
