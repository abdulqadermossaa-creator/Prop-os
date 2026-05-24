import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Home, SlidersHorizontal, Coffee, Phone,
  Wifi, ThermometerSun, Moon, Lightbulb,
  ChevronLeft, Check, ChevronRight,
} from "lucide-react";

const TABS = [
  { id: "home",     icon: Home,             label: "الرئيسية" },
  { id: "controls", icon: SlidersHorizontal, label: "التحكم" },
  { id: "services", icon: Coffee,            label: "الخدمات" },
  { id: "help",     icon: Phone,             label: "المساعدة" },
];

/* ─── Home Tab ─── */
function HomeTab() {
  const [wifiRevealed, setWifiRevealed] = useState(false);

  const quickItems = [
    { icon: Wifi,          label: "الإنترنت", value: wifiRevealed ? "qlvin-A204" : "اضغط للكشف", sub: wifiRevealed ? "2026@secure" : "", color: "#60A5FA", action: () => setWifiRevealed(true) },
    { icon: ThermometerSun,label: "الحرارة",  value: "22°C",     sub: "مريح",     color: "#C8A96A", action: null },
    { icon: Moon,          label: "DND",      value: "شغّال",    sub: "لا تزعج",  color: "#A78BFA", action: null },
    { icon: Lightbulb,     label: "الإضاءة",  value: "70%",      sub: "دافئ",     color: "#FCD34D", action: null },
  ];

  return (
    <div className="space-y-4">
      {/* Guest header */}
      <div
        className="px-6 py-5 rounded-2xl"
        style={{ background: "rgba(200,169,106,0.07)", border: "1px solid rgba(200,169,106,0.14)" }}
      >
        <div className="font-light tracking-[0.28em] mb-1" style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
          ضيفنا الكريم
        </div>
        <div className="text-white font-light" style={{ fontSize: 22, letterSpacing: "-0.01em" }}>
          أحمد العمري
        </div>
        <div className="font-light mt-2" style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
          A-204 · يغادر الجمعة 11:00 ص · 3 ليالٍ متبقية
        </div>
      </div>

      {/* Quick grid */}
      <div className="grid grid-cols-2 gap-3">
        {quickItems.map((item, i) => (
          <button
            key={i}
            onClick={item.action}
            className="flex flex-col items-start px-5 py-4 rounded-2xl text-left transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              cursor: item.action ? "pointer" : "default",
            }}
          >
            <item.icon size={14} style={{ color: item.color, marginBottom: 10 }} />
            <div className="font-light" style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>
              {item.label}
            </div>
            <div className="text-white font-medium" style={{ fontSize: 13 }}>{item.value}</div>
            {item.sub && (
              <div className="font-light" style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", marginTop: 2 }}>
                {item.sub}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Checkout info */}
      <div
        className="flex items-center justify-between px-5 py-4 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div>
          <div className="text-white font-light" style={{ fontSize: 13 }}>وقت المغادرة</div>
          <div className="font-light mt-0.5" style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
            الجمعة 27 مايو · الساعة 11:00 ص
          </div>
        </div>
        <ChevronRight size={13} style={{ color: "rgba(255,255,255,0.18)" }} />
      </div>
    </div>
  );
}

/* ─── Controls Tab ─── */
function RangeControl({ icon: Icon, label, value, onChange, color }) {
  return (
    <div
      className="px-5 py-5 rounded-2xl"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Icon size={14} style={{ color }} />
          <span className="text-white font-light" style={{ fontSize: 13 }}>{label}</span>
        </div>
        <span className="font-medium" style={{ fontSize: 13, color }}>{value}%</span>
      </div>
      <div className="relative h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}60, ${color})` }}
        />
        <input
          type="range" min={0} max={100} value={value}
          onChange={e => onChange(+e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

function ControlsTab() {
  const [ac, setAc]         = useState(60);
  const [lights, setLights] = useState(70);
  const [blinds, setBlinds] = useState(40);

  return (
    <div className="space-y-3">
      <RangeControl icon={ThermometerSun} label="تكييف الهواء" value={ac}     onChange={setAc}     color="#60A5FA" />
      <RangeControl icon={Lightbulb}      label="الإضاءة"      value={lights} onChange={setLights} color="#FCD34D" />
      <RangeControl icon={Moon}           label="الستائر"      value={blinds} onChange={setBlinds} color="#A78BFA" />
    </div>
  );
}

/* ─── Services Tab ─── */
function ServicesTab() {
  const [requested, setRequested] = useState({});

  const services = [
    { id: "towels",    label: "مناشف إضافية",    time: "30 دقيقة" },
    { id: "breakfast", label: "فطور في الغرفة",  time: "45 دقيقة" },
    { id: "cleaning",  label: "تنظيف الوحدة",    time: "ساعة" },
    { id: "laundry",   label: "خدمة الغسيل",     time: "يوم عمل" },
    { id: "late",      label: "تمديد وقت الإقامة", time: "حسب التوفر" },
  ];

  const toggle = id => setRequested(r => ({ ...r, [id]: !r[id] }));

  return (
    <div className="space-y-3">
      {services.map(s => (
        <button
          key={s.id}
          onClick={() => toggle(s.id)}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl text-left transition-all"
          style={{
            background: requested[s.id] ? "rgba(200,169,106,0.08)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${requested[s.id] ? "rgba(200,169,106,0.22)" : "rgba(255,255,255,0.07)"}`,
          }}
        >
          <div>
            <div className="text-white font-light" style={{ fontSize: 13 }}>{s.label}</div>
            <div className="font-light mt-0.5" style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>
              الوقت المتوقع: {s.time}
            </div>
          </div>
          {requested[s.id] ? (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "rgba(200,169,106,0.22)" }}
            >
              <Check size={11} style={{ color: "#C8A96A" }} />
            </div>
          ) : (
            <span className="font-light" style={{ fontSize: 11, color: "rgba(255,255,255,0.22)" }}>اطلب</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ─── Help Tab ─── */
function HelpTab() {
  const items = [
    { label: "الاستقبال",     sub: "متاح 24/7",              action: "اتصل" },
    { label: "الصيانة",       sub: "طوارئ فقط",              action: "اتصل" },
    { label: "واتساب",        sub: "رد خلال دقيقتين",         action: "تواصل" },
    { label: "المساعد الذكي", sub: "QLVIN AI · مساعدة فورية", action: "ابدأ" },
  ];

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-5 py-4 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div>
            <div className="text-white font-light" style={{ fontSize: 13 }}>{item.label}</div>
            <div className="font-light mt-0.5" style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>{item.sub}</div>
          </div>
          <button
            className="px-3.5 py-1.5 rounded-xl font-light transition-colors"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              fontSize: 11,
              color: "rgba(255,255,255,0.55)",
            }}
          >
            {item.action}
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ─── */
const CONTENT = { home: HomeTab, controls: ControlsTab, services: ServicesTab, help: HelpTab };

export default function GuestPortal() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("home");

  const Content = CONTENT[tab];

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col"
      style={{ background: "#07090E" }}
    >
      {/* Ambient */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: 0, left: "50%", transform: "translateX(-50%)",
          width: "70vw", height: "35vh",
          background: "radial-gradient(ellipse, rgba(200,169,106,0.05) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-8 pb-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 transition-colors"
          style={{ color: "rgba(255,255,255,0.28)" }}
        >
          <ChevronLeft size={15} />
          <span className="font-light" style={{ fontSize: 12 }}>الرئيسية</span>
        </button>
        <div className="font-light tracking-[0.28em]" style={{ fontSize: 10, color: "rgba(255,255,255,0.18)" }}>
          بوابة الضيف
        </div>
        <div style={{ width: 64 }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          >
            <Content />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <div className="absolute z-20 bottom-0 inset-x-0 px-5 pb-6 pt-2">
        <div
          className="flex items-center justify-around py-3 px-3 rounded-[22px]"
          style={{
            background: "rgba(18,18,22,0.85)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
          }}
        >
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex flex-col items-center gap-1.5 px-5 py-2 rounded-xl transition-all"
                style={{ background: active ? "rgba(255,255,255,0.07)" : "transparent" }}
              >
                <t.icon size={15} style={{ color: active ? "#C8A96A" : "rgba(255,255,255,0.28)" }} />
                <span
                  className="font-light"
                  style={{ fontSize: 10, color: active ? "rgba(200,169,106,0.85)" : "rgba(255,255,255,0.25)" }}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
