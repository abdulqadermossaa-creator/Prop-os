import { Bell, Search } from "lucide-react";

export default function Header({ title }) {
  return (
    <header className="h-16 border-b border-blue/10 bg-bg/80 backdrop-blur-sm flex items-center px-6 gap-4 sticky top-0 z-10">
      <h1 className="font-semibold text-white text-lg flex-1">{title}</h1>

      {/* Search */}
      <div className="flex items-center gap-2 bg-panel border border-blue/10 rounded-xl px-3 py-2 w-56">
        <Search size={13} className="text-gray-500" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none flex-1"
        />
      </div>

      {/* Notifications */}
      <button className="relative p-2 rounded-xl hover:bg-panel-light transition-colors">
        <Bell size={16} className="text-gray-400" />
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue shadow-glow" />
      </button>
    </header>
  );
}
