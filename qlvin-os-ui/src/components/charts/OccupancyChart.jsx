import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Occupied", value: 87, color: "#2F80FF" },
  { name: "Vacant", value: 9, color: "#FFB547" },
  { name: "Maintenance", value: 4, color: "#FF4D6A" },
];

export default function OccupancyChart() {
  return (
    <div className="bg-panel border border-blue/10 rounded-2xl p-5 animate-fadeIn">
      <div className="mb-5">
        <h3 className="font-semibold text-white">Occupancy Rate</h3>
        <p className="text-xs text-gray-500 mt-0.5">Current portfolio</p>
      </div>

      <div className="flex items-center gap-4">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={55}
              strokeWidth={0}
              dataKey="value"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#0E1628",
                border: "1px solid rgba(47,128,255,0.2)",
                borderRadius: "12px",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex-1 space-y-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: item.color }}
                />
                <span className="text-xs text-gray-400">{item.name}</span>
              </div>
              <span className="text-xs font-semibold text-white">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
