import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Building2, Bot, CreditCard, Bell } from "lucide-react";
import PropertyCard from "../components/cards/PropertyCard";
import CommandBar from "../components/ai/CommandBar";
import AIStateOrb from "../components/ai/AIStateOrb";
import GlowPulse from "../components/motion/GlowPulse";

const mobileProperties = [
  { name: "Villa 12", status: "Occupied", rent: "8,500", location: "Riyadh — Al Malaz", units: 1 },
  { name: "Tower A3", status: "Vacant", rent: "12,000", location: "Jeddah — Al Hamra", units: 4 },
  { name: "Unit 204", status: "Occupied", rent: "6,200", location: "Riyadh — Olaya", units: 1 },
];

const NAV_ITEMS = [
  { icon: Home, label: "Home", id: "home" },
  { icon: Building2, label: "Properties", id: "properties" },
  { icon: Bot, label: "AI", id: "ai" },
  { icon: CreditCard, label: "Payments", id: "payments" },
];

export default function Mobile() {
  const [activeTab, setActiveTab] = useState("home");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState("");

  function handleAISubmit(query) {
    setAiQuery(query);
    setCmdOpen(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#040609" }}
    >
      {/* Phone frame */}
      <div
        className="relative overflow-hidden flex flex-col"
        style={{
          width: 390,
          height: 844,
          background: "#070A12",
          borderRadius: 44,
          border: "1.5px solid rgba(47,128,255,0.2)",
          boxShadow: "0 0 80px rgba(47,128,255,0.12), 0 0 200px rgba(47,128,255,0.06), 0 40px 100px rgba(0,0,0,0.8)",
        }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2 flex-shrink-0">
          <span className="text-xs text-white font-semibold">9:41</span>
          <div className="flex items-center gap-1.5">
            <div className="text-xs text-white opacity-70">●●●</div>
          </div>
        </div>

        {/* Header */}
        <motion.div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="w-9 h-9 rounded-full bg-blue flex items-center justify-center text-white font-black text-base shadow-glow"
              animate={{
                boxShadow: [
                  "0 0 12px rgba(47,128,255,0.4)",
                  "0 0 25px rgba(47,128,255,0.7)",
                  "0 0 12px rgba(47,128,255,0.4)",
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              Q
            </motion.div>
            <div>
              <p className="text-white font-bold text-sm leading-none">QLVIN OS</p>
              <p className="text-gray-500 text-xs mt-0.5">Good morning, Ahmed</p>
            </div>
          </div>
          <motion.button
            className="w-9 h-9 rounded-full bg-panel border border-white/10 flex items-center justify-center text-gray-400 hover:text-white relative"
            whileTap={{ scale: 0.9 }}
          >
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue border border-bg" />
          </motion.button>
        </motion.div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-4 pb-2" style={{ scrollbarWidth: "none" }}>
          <AnimatePresence mode="wait">
            {activeTab === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <motion.div
                    className="bg-panel border border-blue/10 rounded-2xl p-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                    <p className="text-white font-bold text-lg">120K</p>
                    <p className="text-xs text-blue mt-0.5">+12% this month</p>
                  </motion.div>
                  <motion.div
                    className="bg-panel border border-cyan/10 rounded-2xl p-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <p className="text-xs text-gray-500 mb-1">Occupancy</p>
                    <p className="text-white font-bold text-lg">87%</p>
                    <p className="text-xs text-cyan mt-0.5">3 units vacant</p>
                  </motion.div>
                </div>

                {/* AI insight card */}
                {aiQuery && (
                  <motion.div
                    className="bg-panel border border-purple-500/20 rounded-2xl p-4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-blue flex items-center justify-center text-white text-xs font-bold">Q</div>
                      <span className="text-xs text-purple-400 font-medium uppercase tracking-wider">AI Response</span>
                    </div>
                    <p className="text-xs text-gray-400">Query: <span className="text-white">{aiQuery}</span></p>
                    <p className="text-xs text-gray-500 mt-1">Processing your request with QLVIN AI...</p>
                  </motion.div>
                )}

                {/* Properties section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-sm">Your Properties</h3>
                    <span className="text-xs text-gray-500">3 total</span>
                  </div>
                  <div className="space-y-3">
                    {mobileProperties.map((p, i) => (
                      <motion.div
                        key={p.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                      >
                        <PropertyCard {...p} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "properties" && (
              <motion.div
                key="properties"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-3 mt-2"
              >
                <h3 className="text-white font-semibold text-sm mb-4">All Properties</h3>
                {mobileProperties.map((p, i) => (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <PropertyCard {...p} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeTab === "ai" && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center justify-center py-12 gap-6"
              >
                <AIStateOrb state="idle" />
                <div className="text-center">
                  <p className="text-white font-semibold mb-1">QLVIN AI Assistant</p>
                  <p className="text-gray-500 text-xs">Ask anything about your portfolio</p>
                </div>
                <motion.button
                  className="px-6 py-2.5 bg-blue/10 border border-blue/30 text-blue rounded-xl text-sm font-medium"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setCmdOpen(true)}
                >
                  Open Command Bar
                </motion.button>
              </motion.div>
            )}

            {activeTab === "payments" && (
              <motion.div
                key="payments"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="mt-2"
              >
                <h3 className="text-white font-semibold text-sm mb-4">Payments</h3>
                {[
                  { name: "Villa 12 — Ahmed", amount: "8,500 SAR", due: "Due in 3 days", color: "#FFB547" },
                  { name: "Suite 501 — Sara", amount: "15,000 SAR", due: "Paid", color: "#00C896" },
                  { name: "Unit 204 — Khalid", amount: "6,200 SAR", due: "Overdue 2 days", color: "#FF4D6A" },
                ].map((p, i) => (
                  <motion.div
                    key={p.name}
                    className="bg-panel border border-white/5 rounded-xl p-4 mb-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-medium">{p.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: p.color }}>{p.due}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-sm">{p.amount}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating AI bubble */}
        <motion.button
          className="absolute right-4 rounded-full z-30 flex items-center justify-center shadow-glow"
          style={{
            bottom: 88,
            width: 52,
            height: 52,
            background: "#2F80FF",
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCmdOpen(true)}
          animate={{
            boxShadow: [
              "0 0 15px rgba(47,128,255,0.4)",
              "0 0 30px rgba(47,128,255,0.7)",
              "0 0 15px rgba(47,128,255,0.4)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Bot size={22} className="text-white" />
        </motion.button>

        {/* Bottom nav */}
        <div
          className="flex-shrink-0 flex items-center justify-around px-4 pt-2 pb-4 border-t border-white/5"
          style={{ background: "rgba(7,10,18,0.95)" }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const IconComp = item.icon;
            return (
              <motion.button
                key={item.id}
                className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl relative"
                onClick={() => setActiveTab(item.id)}
                whileTap={{ scale: 0.9 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-xl bg-blue/10 border border-blue/20"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <IconComp
                  size={20}
                  className={`relative z-10 transition-colors ${isActive ? "text-blue" : "text-gray-600"}`}
                />
                <span
                  className={`text-xs relative z-10 transition-colors ${isActive ? "text-blue" : "text-gray-600"}`}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Command bar (inside phone frame) */}
        {cmdOpen && (
          <div className="absolute inset-0 z-40">
            <CommandBar
              open={cmdOpen}
              onSubmit={handleAISubmit}
              onClose={() => setCmdOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
