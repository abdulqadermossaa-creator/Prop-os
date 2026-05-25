import { useState, useEffect } from "react";
import { DollarSign, BarChart2, Building2, ShieldCheck } from "lucide-react";
import KpiCard from "../components/cards/KpiCard";
import PropertyCard from "../components/cards/PropertyCard";
import AIInsight from "../components/ai/AIInsight";
import RevenueChart from "../components/charts/RevenueChart";
import OccupancyChart from "../components/charts/OccupancyChart";
import Header from "../components/layout/Header";
import CommandBar from "../components/ai/CommandBar";

const kpis = [
  { title: "Total Revenue", value: "120K SAR", trend: "+12%", icon: DollarSign, accentColor: "blue" },
  { title: "Occupancy Rate", value: "87%", trend: "+3%", icon: BarChart2, accentColor: "cyan" },
  { title: "Active Units", value: "42", trend: "Stable", icon: Building2, accentColor: "gold" },
  { title: "Risk Score", value: "Low", trend: "AI Safe", icon: ShieldCheck, accentColor: "success" },
];

const properties = [
  { name: "Villa 12", status: "Occupied", rent: "8,500", location: "Riyadh — Al Malaz", units: 1 },
  { name: "Tower A3", status: "Vacant", rent: "12,000", location: "Jeddah — Al Hamra", units: 4 },
  { name: "Unit 204", status: "Occupied", rent: "6,200", location: "Riyadh — Olaya", units: 1 },
  { name: "Complex B", status: "Maintenance", rent: "9,800", location: "Dammam — Corniche", units: 6 },
  { name: "Suite 501", status: "Occupied", rent: "15,000", location: "Riyadh — KAFD", units: 1 },
  { name: "Block 7", status: "Vacant", rent: "7,400", location: "Mecca — Al Aziziyah", units: 3 },
];

const aiInsights = [
  {
    text: "Unit A3 likely to be rented within 5 days based on demand trends in Al Hamra area.",
    type: "trend",
    confidence: 82,
  },
  {
    text: "3 leases expiring in 30 days — early renewal outreach recommended to protect revenue.",
    type: "alert",
    confidence: 95,
  },
  {
    text: "Revenue forecast for Q3: +14% growth projected if current occupancy holds.",
    type: "insight",
    confidence: 78,
  },
];

export default function Dashboard() {
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleCommandSubmit(query) {
    console.log("[QLVIN AI]", query);
    setCmdOpen(false);
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-auto">
      <Header title="Dashboard" hint="⌘K — AI Command" onHintClick={() => setCmdOpen(true)} />

      <main className="p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.title} {...kpi} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <RevenueChart />
          </div>
          <OccupancyChart />
        </div>

        {/* Properties Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Properties</h2>
            <span className="text-xs text-gray-500">{properties.length} total</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {properties.map((p) => (
              <PropertyCard key={p.name} {...p} />
            ))}
          </div>
        </div>

        {/* AI Insights Row */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-white">AI Insights</h2>
            <span className="text-xs bg-cyan/10 text-cyan border border-cyan/20 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiInsights.map((insight, i) => (
              <AIInsight key={i} {...insight} />
            ))}
          </div>
        </div>
      </main>

      <CommandBar
        open={cmdOpen}
        onSubmit={handleCommandSubmit}
        onClose={() => setCmdOpen(false)}
      />
    </div>
  );
}
