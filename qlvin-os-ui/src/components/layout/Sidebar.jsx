import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Brain,
  Settings,
  ChevronRight,
  Smartphone,
  KeyRound,
  TrendingUp,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Properties", path: "/properties", icon: Building2 },
  { label: "Tenants", path: "/tenants", icon: Users },
  { label: "Payments", path: "/payments", icon: CreditCard },
  { label: "AI Engine", path: "/ai", icon: Brain },
  { label: "Investor", path: "/investor", icon: TrendingUp },
  { label: "Guest Card", path: "/guest", icon: KeyRound },
  { label: "Mobile", path: "/mobile", icon: Smartphone },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-panel border-r border-blue/10 flex flex-col sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-blue/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue shadow-glow flex items-center justify-center">
            <span className="text-white font-black text-sm">Q</span>
          </div>
          <div>
            <div className="font-bold text-white leading-none">QLVIN OS</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Real Estate Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                isActive
                  ? "bg-blue/15 text-blue border border-blue/20 shadow-glow"
                  : "text-gray-400 hover:text-white hover:bg-panel-light"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? "text-blue" : "group-hover:text-white"} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={12} className="text-blue opacity-60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-blue/10">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue to-cyan flex items-center justify-center text-xs font-bold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white truncate">Admin</div>
            <div className="text-[10px] text-gray-500 truncate">qlvin.os</div>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        </div>
      </div>
    </aside>
  );
}
