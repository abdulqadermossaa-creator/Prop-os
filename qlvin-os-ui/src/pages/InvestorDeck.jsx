import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AIStateOrb from "../components/ai/AIStateOrb";
import Button from "../components/ui/Button";

const slides = [
  {
    id: 1,
    component: Slide1Cover,
  },
  {
    id: 2,
    component: Slide2Vision,
  },
  {
    id: 3,
    component: Slide3Problem,
  },
  {
    id: 4,
    component: Slide4Solution,
  },
  {
    id: 5,
    component: Slide5Product,
  },
  {
    id: 6,
    component: Slide6Market,
  },
  {
    id: 7,
    component: Slide7BusinessModel,
  },
  {
    id: 8,
    component: Slide8AIAdvantage,
  },
  {
    id: 9,
    component: Slide9Demo,
  },
  {
    id: 10,
    component: Slide10Closing,
  },
];

function SlideWrapper({ children }) {
  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center px-8 md:px-20"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Slide1Cover() {
  return (
    <SlideWrapper>
      <div className="flex flex-col items-center gap-6 text-center">
        <motion.div
          className="w-24 h-24 rounded-full bg-blue flex items-center justify-center text-white font-black text-4xl shadow-glow"
          animate={{
            boxShadow: [
              "0 0 30px rgba(47,128,255,0.5), 0 0 60px rgba(47,128,255,0.2)",
              "0 0 60px rgba(47,128,255,0.9), 0 0 120px rgba(47,128,255,0.4)",
              "0 0 30px rgba(47,128,255,0.5), 0 0 60px rgba(47,128,255,0.2)",
            ],
            scale: [1, 1.04, 1],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          Q
        </motion.div>
        <div>
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tight mb-4">
            QLVIN <span className="text-blue">OS</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-light">
            The Real Estate Operating System
          </p>
        </div>
        <div className="mt-4 flex gap-2 items-center">
          <span className="w-8 h-px bg-blue/50" />
          <span className="text-xs text-gray-600 uppercase tracking-widest">Confidential — 2025</span>
          <span className="w-8 h-px bg-blue/50" />
        </div>
      </div>
    </SlideWrapper>
  );
}

function Slide2Vision() {
  return (
    <SlideWrapper>
      <div className="max-w-3xl text-center">
        <p className="text-xs text-blue uppercase tracking-widest mb-6 font-semibold">Our Vision</p>
        <h2 className="text-4xl md:text-6xl font-black text-white leading-tight mb-8">
          We believe real estate management should feel like{" "}
          <span className="text-cyan">running a space mission.</span>
        </h2>
        <p className="text-gray-400 text-lg leading-relaxed">
          Precision. Intelligence. Total command — from one unified cockpit.
        </p>
        <div className="mt-12 flex justify-center gap-12">
          {["Mission Control", "Real-Time Intel", "Zero Friction"].map((item) => (
            <motion.div
              key={item}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-2 h-2 rounded-full bg-cyan mx-auto mb-2" />
              <p className="text-xs text-gray-500 uppercase tracking-wider">{item}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </SlideWrapper>
  );
}

function Slide3Problem() {
  const problems = [
    {
      title: "Fragmented Tools",
      desc: "Landlords juggle 6+ disconnected apps — spreadsheets, WhatsApp, paper contracts.",
      icon: "⚡",
    },
    {
      title: "No AI Intelligence",
      desc: "Zero predictive insight. Decisions made on gut feel, not data.",
      icon: "🧠",
    },
    {
      title: "Manual Everything",
      desc: "Rent collection, maintenance, renewals — all done by hand, every time.",
      icon: "⚙️",
    },
  ];

  return (
    <SlideWrapper>
      <div className="w-full max-w-4xl">
        <p className="text-xs text-danger uppercase tracking-widest mb-3 font-semibold text-center">The Problem</p>
        <h2 className="text-4xl font-black text-white text-center mb-10">
          The industry is broken.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <motion.div
              key={p.title}
              className="bg-danger/5 border border-danger/20 rounded-2xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="text-3xl mb-4">{p.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">{p.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </SlideWrapper>
  );
}

function Slide4Solution() {
  const pillars = [
    { title: "AI Engine", color: "#A78BFA", desc: "Predictive insights, risk scoring, demand forecasting" },
    { title: "Automation", color: "#2F80FF", desc: "Rent collection, renewals, maintenance — fully automated" },
    { title: "Analytics", color: "#00E5FF", desc: "Live dashboards, portfolio performance, custom reports" },
  ];

  return (
    <SlideWrapper>
      <div className="w-full max-w-4xl text-center">
        <p className="text-xs text-blue uppercase tracking-widest mb-3 font-semibold">The Solution</p>
        <h2 className="text-4xl font-black text-white mb-3">
          QLVIN OS unifies your entire portfolio.
        </h2>
        <p className="text-gray-400 mb-10">One platform. Total intelligence. Zero complexity.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              className="bg-panel border rounded-2xl p-7"
              style={{ borderColor: `${pillar.color}30` }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 mx-auto"
                style={{ background: `${pillar.color}20` }}
              >
                {i === 0 ? "🤖" : i === 1 ? "⚡" : "📊"}
              </div>
              <h3 className="font-bold text-white mb-2" style={{ color: pillar.color }}>
                {pillar.title}
              </h3>
              <p className="text-gray-500 text-sm">{pillar.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </SlideWrapper>
  );
}

function Slide5Product() {
  return (
    <SlideWrapper>
      <div className="w-full max-w-4xl">
        <p className="text-xs text-cyan uppercase tracking-widest mb-3 font-semibold text-center">Product</p>
        <h2 className="text-4xl font-black text-white text-center mb-10">
          Built for operators. Designed for scale.
        </h2>
        {/* Mock dashboard layout */}
        <div className="bg-panel border border-blue/10 rounded-2xl p-4 shadow-glow">
          {/* Header mock */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/5">
            <div className="w-6 h-6 rounded bg-blue/20" />
            <div className="flex-1 h-2 rounded bg-white/5" />
            <div className="w-16 h-2 rounded bg-blue/20" />
            <div className="w-16 h-2 rounded bg-cyan/20" />
          </div>
          <div className="flex gap-4">
            {/* Sidebar mock */}
            <div className="w-14 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`h-8 rounded-lg ${i === 1 ? "bg-blue/30" : "bg-white/5"}`} />
              ))}
            </div>
            {/* Content mock */}
            <div className="flex-1 space-y-3">
              {/* KPI row */}
              <div className="grid grid-cols-4 gap-2">
                {["blue", "cyan", "gold", "success"].map((c) => (
                  <div key={c} className={`h-16 rounded-xl bg-panel-light border border-${c}/10`} />
                ))}
              </div>
              {/* Charts row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 h-24 rounded-xl bg-panel-light border border-blue/10" />
                <div className="h-24 rounded-xl bg-panel-light border border-cyan/10" />
              </div>
              {/* Cards row */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-panel-light border border-white/5" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}

function Slide6Market() {
  const stats = [
    { value: "SAR 2.3T", label: "Saudi Real Estate Market", color: "#C8A96A" },
    { value: "2.1M", label: "Rental Units in KSA", color: "#00E5FF" },
    { value: "87%", label: "Still Managed Manually", color: "#FF4D6A" },
  ];

  return (
    <SlideWrapper>
      <div className="w-full max-w-4xl text-center">
        <p className="text-xs text-gold uppercase tracking-widest mb-3 font-semibold">Market Opportunity</p>
        <h2 className="text-4xl font-black text-white mb-12">
          A massive, underserved market.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
            >
              <div
                className="text-5xl font-black mb-2"
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>
        <motion.p
          className="mt-12 text-gray-600 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Source: GASTAT, Saudi Central Bank 2024
        </motion.p>
      </div>
    </SlideWrapper>
  );
}

function Slide7BusinessModel() {
  const tiers = [
    {
      name: "Starter",
      price: "99",
      currency: "SAR/mo",
      features: ["Up to 10 units", "Basic AI insights", "Rent tracking", "Email support"],
      color: "#2F80FF",
      highlight: false,
    },
    {
      name: "Pro",
      price: "299",
      currency: "SAR/mo",
      features: ["Up to 100 units", "Full AI suite", "Automation workflows", "Priority support"],
      color: "#00E5FF",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      currency: "",
      features: ["Unlimited units", "Custom AI training", "Dedicated manager", "SLA guarantee"],
      color: "#C8A96A",
      highlight: false,
    },
  ];

  return (
    <SlideWrapper>
      <div className="w-full max-w-4xl">
        <p className="text-xs text-blue uppercase tracking-widest mb-3 font-semibold text-center">Business Model</p>
        <h2 className="text-4xl font-black text-white text-center mb-10">
          Simple SaaS pricing.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              className={`bg-panel rounded-2xl p-6 border ${
                tier.highlight ? "border-cyan/40 shadow-cyanGlow" : "border-white/5"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
            >
              {tier.highlight && (
                <div className="text-xs text-cyan bg-cyan/10 border border-cyan/20 rounded-full px-3 py-0.5 mb-3 inline-block">
                  Most Popular
                </div>
              )}
              <h3 className="text-white font-bold text-lg mb-1">{tier.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-black" style={{ color: tier.color }}>
                  {tier.price}
                </span>
                {tier.currency && (
                  <span className="text-gray-500 text-sm ml-1">{tier.currency}</span>
                )}
              </div>
              <ul className="space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="text-gray-400 text-sm flex items-center gap-2">
                    <span style={{ color: tier.color }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </SlideWrapper>
  );
}

function Slide8AIAdvantage() {
  return (
    <SlideWrapper>
      <div className="w-full max-w-3xl text-center">
        <p className="text-xs text-purple-400 uppercase tracking-widest mb-3 font-semibold">AI Advantage</p>
        <h2 className="text-4xl font-black text-white mb-4">
          Proprietary AI trained on KSA real estate data.
        </h2>
        <p className="text-gray-400 mb-10 text-lg">
          QLVIN&apos;s models understand Riyadh neighborhoods, Saudi lease law, and regional demand cycles.
        </p>
        <div className="flex justify-center mb-10">
          <AIStateOrb state="thinking" />
        </div>
        <div className="grid grid-cols-3 gap-6 mt-4">
          {[
            { label: "Predictions", value: "94% accuracy" },
            { label: "Training data", value: "500K+ leases" },
            { label: "Response time", value: "<200ms" },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-purple-400 font-bold text-xl mb-1">{item.value}</div>
              <div className="text-gray-500 text-xs uppercase tracking-wider">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </SlideWrapper>
  );
}

function Slide9Demo() {
  return (
    <SlideWrapper>
      <div className="w-full max-w-4xl text-center">
        <p className="text-xs text-cyan uppercase tracking-widest mb-3 font-semibold">Live Product</p>
        <h2 className="text-4xl font-black text-white mb-4">See it live.</h2>
        <p className="text-gray-400 mb-8">The command center for modern real estate operators.</p>
        {/* Frosted glass mockup */}
        <motion.div
          className="relative rounded-2xl overflow-hidden border border-white/10"
          style={{
            background: "rgba(14, 22, 40, 0.6)",
            backdropFilter: "blur(20px)",
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Blur overlay */}
          <div
            className="absolute inset-0 z-10"
            style={{
              backdropFilter: "blur(4px)",
              background: "rgba(7, 10, 18, 0.3)",
            }}
          />
          <div className="relative p-6 space-y-4">
            {/* Faux header */}
            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <div className="w-8 h-8 rounded-full bg-blue/20" />
              <div className="h-2 w-32 rounded bg-white/10" />
              <div className="flex-1" />
              <div className="h-2 w-20 rounded bg-blue/10" />
            </div>
            {/* Faux KPIs */}
            <div className="grid grid-cols-4 gap-3">
              {["blue", "cyan", "gold", "success"].map((c, i) => (
                <div key={i} className="h-20 rounded-xl bg-panel-light border border-white/5" />
              ))}
            </div>
            {/* Faux chart */}
            <div className="h-32 rounded-xl bg-panel-light border border-white/5" />
          </div>
          {/* Centered CTA on blur */}
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="text-center">
              <div className="text-white font-bold text-xl mb-2">Request a live demo</div>
              <div className="text-gray-400 text-sm">See QLVIN OS in action</div>
            </div>
          </div>
        </motion.div>
      </div>
    </SlideWrapper>
  );
}

function Slide10Closing() {
  return (
    <SlideWrapper>
      <div className="text-center max-w-2xl">
        <motion.div
          className="w-20 h-20 rounded-full bg-blue flex items-center justify-center text-white font-black text-3xl shadow-glow mx-auto mb-8"
          animate={{
            scale: [1, 1.06, 1],
            boxShadow: [
              "0 0 30px rgba(47,128,255,0.4)",
              "0 0 70px rgba(47,128,255,0.8)",
              "0 0 30px rgba(47,128,255,0.4)",
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          Q
        </motion.div>
        <h2 className="text-5xl font-black text-white mb-4">
          Join the OS Revolution.
        </h2>
        <p className="text-gray-400 text-lg mb-8">
          We&apos;re onboarding our first 50 beta partners in Q1 2025.
          <br />
          Limited spots. Founding member pricing locked for life.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Contact us at{" "}
          <span className="text-cyan">hello@qlvin.com</span>
        </p>
        <Button variant="primary" className="text-base px-8 py-3">
          Request Access →
        </Button>
        <div className="mt-8 flex gap-2 items-center justify-center">
          <span className="w-8 h-px bg-blue/30" />
          <span className="text-xs text-gray-700 uppercase tracking-widest">qlvin.com</span>
          <span className="w-8 h-px bg-blue/30" />
        </div>
      </div>
    </SlideWrapper>
  );
}

export default function InvestorDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const total = slides.length;

  function goTo(index) {
    if (index < 0 || index >= total) return;
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  }

  function goNext() {
    goTo(currentSlide + 1);
  }

  function goPrev() {
    goTo(currentSlide - 1);
  }

  const SlideComponent = slides[currentSlide].component;

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none"
      style={{ background: "#070A12" }}
    >
      {/* Background stars/particles */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-px bg-white rounded-full"
            style={{
              left: `${(i * 37.3) % 100}%`,
              top: `${(i * 23.7) % 100}%`,
              opacity: Math.random() * 0.5 + 0.1,
            }}
          />
        ))}
      </div>

      {/* Slide content */}
      <div className="relative w-full h-full">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            className="absolute inset-0"
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          >
            <SlideComponent />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Prev arrow */}
      <motion.button
        className="fixed left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-panel border border-white/10 text-gray-400 hover:text-white hover:border-blue/30 flex items-center justify-center z-50 transition-colors"
        onClick={goPrev}
        disabled={currentSlide === 0}
        whileHover={{ scale: 1.1, x: -2 }}
        whileTap={{ scale: 0.9 }}
        style={{ opacity: currentSlide === 0 ? 0.2 : 1 }}
      >
        ←
      </motion.button>

      {/* Next arrow */}
      <motion.button
        className="fixed right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-panel border border-white/10 text-gray-400 hover:text-white hover:border-blue/30 flex items-center justify-center z-50 transition-colors"
        onClick={goNext}
        disabled={currentSlide === total - 1}
        whileHover={{ scale: 1.1, x: 2 }}
        whileTap={{ scale: 0.9 }}
        style={{ opacity: currentSlide === total - 1 ? 0.2 : 1 }}
      >
        →
      </motion.button>

      {/* Slide counter */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
        <span className="text-xs text-gray-500 font-mono tabular-nums">
          {currentSlide + 1} / {total}
        </span>
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="transition-all duration-300"
            >
              <div
                className={`rounded-full transition-all duration-300 ${
                  i === currentSlide
                    ? "w-4 h-1.5 bg-blue"
                    : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
