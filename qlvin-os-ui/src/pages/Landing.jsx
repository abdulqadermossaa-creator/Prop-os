import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";

const features = [
  { label: "AI-Powered Insights", desc: "Predict vacancies before they happen" },
  { label: "Real-Time Analytics", desc: "Live revenue & occupancy tracking" },
  { label: "Smart Automation", desc: "Lease renewals, payments, alerts" },
  { label: "Multi-Property", desc: "Manage entire portfolios in one OS" },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-blue/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue shadow-glow flex items-center justify-center">
            <span className="text-white font-black text-xs">Q</span>
          </div>
          <span className="font-bold text-white">QLVIN OS</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            Sign In
          </Button>
          <Button variant="primary" onClick={() => navigate("/dashboard")}>
            Request Demo
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="inline-flex items-center gap-2 bg-blue/10 border border-blue/20 px-4 py-1.5 rounded-full text-xs text-blue mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-blue animate-pulse" />
          Real Estate Operating System — Powered by AI
        </div>

        <h1 className="text-6xl font-black mb-4 leading-tight">
          <span className="text-white">Manage Every Property</span>
          <br />
          <span className="text-gradient-blue">Like an Operating System</span>
        </h1>

        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          QLVIN OS unifies your real estate portfolio with AI intelligence,
          real-time analytics, and automation — all in one dark, powerful interface.
        </p>

        <div className="flex gap-4">
          <Button variant="primary" onClick={() => navigate("/dashboard")}>
            Launch Dashboard →
          </Button>
          <Button variant="cyan">Watch Demo</Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-4xl w-full">
          {features.map((f) => (
            <div
              key={f.label}
              className="bg-panel border border-blue/10 rounded-2xl p-5 text-left hover:border-blue/30 hover:shadow-glow transition-all"
            >
              <div className="w-2 h-2 rounded-full bg-cyan mb-3" />
              <p className="text-sm font-semibold text-white mb-1">{f.label}</p>
              <p className="text-xs text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-blue/10 px-8 py-4 flex items-center justify-between">
        <span className="text-xs text-gray-600">© 2026 QLVIN OS — All rights reserved</span>
        <span className="text-xs text-gray-600">Built for the future of real estate</span>
      </footer>
    </div>
  );
}
