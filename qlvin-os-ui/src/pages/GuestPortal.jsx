import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, Wifi, Moon, Coffee, Phone,
  ThermometerSun, Lightbulb, PanelTop, Check, ChevronDown,
} from "lucide-react";
import { usePropertyState } from "../context/PropertyStateEngine";

/* ─── iOS-style Vertical Pill Slider ─── */
function VerticalSlider({ icon: Icon, label, value, onChange, color, unit = "%" }) {
  const trackRef = useRef(null);
  const dragging  = useRef(false);

  const calcValue = (clientY) => {
    const el   = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rel  = 1 - (clientY - rect.top) / rect.height;
    const val  = Math.round(Math.max(0, Math.min(1, rel)) * 100);
    onChange(val);
  };

  const onPointerDown = (e) => {
    dragging.current = true;
    calcValue(e.clientY);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => { if (dragging.current) calcValue(e.clientY); };
  const onPointerUp   = ()  => { dragging.current = false; };

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Pill track */}
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: "relative",
          width: 54,
          height: 170,
          borderRadius: 27,
          background: "rgba(255,255,255,0.055)",
          border: "0.5px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          overflow: "hidden",
          cursor: "ns-resize",
          touchAction: "none",
        }}
      >
        {/* Fill — grows from bottom */}
        <motion.div
          animate={{ height: `${value}%` }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            background: `linear-gradient(to top, ${color}CC 0%, ${color}40 100%)`,
            borderRadius: 27,
          }}
        />

        {/* White indicator line at current level */}
        <motion.div
          animate={{ bottom: `calc(${value}% - 1px)` }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: 10, right: 10,
            height: 2,
            borderRadius: 1,
            background: "rgba(255,255,255,0.85)",
          }}
        />

        {/* Icon — top of pill */}
        <div style={{
          position: "absolute",
          top: 14, left: 0, right: 0,
          display: "flex", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <Icon size={13} style={{ color: "rgba(255,255,255,0.45)" }} />
        </div>
      </div>

      {/* Label + value */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 200, color: "rgba(255,255,255,0.4)" }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 300, color, marginTop: 2 }}>{value}{unit}</div>
      </div>
    </div>
  );
}

/* ─── Glass Tile ─── */
function GlassTile({ icon: Icon, label, value, active, onToggle, accent = "rgba(255,255,255,0.9)", wide }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "16px 18px",
        borderRadius: 18,
        background: active ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.05)",
        border: `0.5px solid ${active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)"}`,
        backdropFilter: "blur(36px)",
        WebkitBackdropFilter: "blur(36px)",
        cursor: onToggle ? "pointer" : "default",
        gridColumn: wide ? "span 2" : undefined,
        textAlign: "left",
        transition: "all 0.2s ease",
      }}
    >
      <Icon size={14} style={{ color: active ? accent : "rgba(255,255,255,0.32)", marginBottom: 10 }} />
      <div style={{ fontSize: 12, fontWeight: 300, color: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.55)" }}>
        {label}
      </div>
      {value && (
        <div style={{ fontSize: 11, fontWeight: 200, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>
          {value}
        </div>
      )}
    </button>
  );
}

/* ─── Services ─── */
const SERVICES = [
  { id: "towels",    label: "مناشف إضافية",      time: "30 دقيقة" },
  { id: "breakfast", label: "فطور في الغرفة",    time: "45 دقيقة" },
  { id: "cleaning",  label: "تنظيف الوحدة",      time: "ساعة"     },
  { id: "laundry",   label: "خدمة الغسيل",       time: "يوم عمل"  },
];

/* ─── Main ─── */
export default function GuestPortal() {
  const navigate = useNavigate();
  const { guest, scenario } = usePropertyState();

  const [wifiRevealed, setWifiRevealed] = useState(false);
  const [dnd,  setDnd]  = useState(true);
  const [ac,   setAc]   = useState(62);
  const [light,setLight]= useState(70);
  const [blind,setBlind]= useState(38);
  const [requested, setRequested] = useState({});
  const [servicesOpen, setServicesOpen] = useState(false);

  const toggle = id => setRequested(r => ({ ...r, [id]: !r[id] }));
  const accent = scenario?.accent || "#C8A96A";

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col"
      style={{ background: "#070705" }}
    >
      {/* Ambient */}
      <div className="absolute pointer-events-none" style={{
        top: 0, left: "50%", transform: "translateX(-50%)",
        width: "75vw", height: "38vh",
        background: `radial-gradient(ellipse, ${accent}08 0%, transparent 70%)`,
      }} />

      {/* Header */}
      <div
        className="relative z-10 flex items-center justify-between px-7 pt-8 pb-5"
        style={{ flexShrink: 0 }}
      >
        <button
          onClick={() => navigate("/")}
          style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.28)" }}
        >
          <ChevronLeft size={14} />
          <span style={{ fontSize: 12, fontWeight: 200 }}>الرئيسية</span>
        </button>
        <div style={{ fontSize: 10, fontWeight: 200, letterSpacing: "0.3em", color: "rgba(255,255,255,0.18)" }}>
          بوابة الضيف
        </div>
        <div style={{ width: 70 }} />
      </div>

      {/* Scrollable content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-10" style={{ scrollbarWidth: "none" }}>

        {/* Guest card */}
        <div style={{
          padding: "20px 22px",
          borderRadius: 22,
          background: `${accent}0C`,
          border: `0.5px solid ${accent}22`,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 10, fontWeight: 200, letterSpacing: "0.3em", color: `${accent}99`, marginBottom: 6 }}>
            ضيفنا الكريم
          </div>
          <div style={{ fontSize: 22, fontWeight: 100, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em" }}>
            {guest.name}
          </div>
          <div style={{ fontSize: 12, fontWeight: 200, color: "rgba(255,255,255,0.28)", marginTop: 6, lineHeight: 1.6 }}>
            {guest.unitId} · يغادر {guest.checkoutDate} {guest.checkoutTime} · {guest.nights - 2} ليالٍ متبقية
          </div>
        </div>

        {/* ── Vertical sliders (iOS Control Center style) ── */}
        <div style={{
          padding: "22px 20px 20px",
          borderRadius: 22,
          background: "rgba(255,255,255,0.04)",
          border: "0.5px solid rgba(255,255,255,0.07)",
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, fontWeight: 200, letterSpacing: "0.3em", color: "rgba(255,255,255,0.22)", marginBottom: 20 }}>
            التحكم بالوحدة
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end" }}>
            <VerticalSlider icon={ThermometerSun} label="التكييف" value={ac}    onChange={setAc}    color="#60A5FA" unit="°" />
            <VerticalSlider icon={Lightbulb}      label="الإضاءة" value={light} onChange={setLight} color={accent} unit="%" />
            <VerticalSlider icon={PanelTop}        label="الستائر" value={blind} onChange={setBlind} color="#A78BFA" unit="%" />
          </div>
        </div>

        {/* ── Tile grid ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 16,
        }}>
          <GlassTile
            icon={Wifi}
            label="الإنترنت"
            value={wifiRevealed ? "qlvin-A204 · 2026@secure" : "اضغط للكشف"}
            active={wifiRevealed}
            onToggle={() => setWifiRevealed(true)}
            accent={accent}
          />
          <GlassTile
            icon={Moon}
            label={dnd ? "لا تزعج — شغّال" : "لا تزعج — إيقاف"}
            active={dnd}
            onToggle={() => setDnd(d => !d)}
            accent="#A78BFA"
          />
        </div>

        {/* ── Services ── */}
        <div style={{
          borderRadius: 22,
          background: "rgba(255,255,255,0.04)",
          border: "0.5px solid rgba(255,255,255,0.07)",
          overflow: "hidden",
          marginBottom: 16,
        }}>
          <button
            onClick={() => setServicesOpen(o => !o)}
            style={{
              width: "100%",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 22px",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Coffee size={14} style={{ color: "rgba(255,255,255,0.32)" }} />
              <span style={{ fontSize: 13, fontWeight: 200, color: "rgba(255,255,255,0.7)" }}>خدمات الغرفة</span>
            </div>
            <motion.div animate={{ rotate: servicesOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.25)" }} />
            </motion.div>
          </button>

          <AnimatePresence>
            {servicesOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {SERVICES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => toggle(s.id)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "14px 16px",
                        borderRadius: 14,
                        background: requested[s.id] ? `${accent}0E` : "rgba(255,255,255,0.03)",
                        border: `0.5px solid ${requested[s.id] ? `${accent}28` : "rgba(255,255,255,0.06)"}`,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 200, color: "rgba(255,255,255,0.75)" }}>{s.label}</div>
                        <div style={{ fontSize: 11, fontWeight: 200, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>
                          الوقت المتوقع: {s.time}
                        </div>
                      </div>
                      {requested[s.id]
                        ? <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${accent}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Check size={11} style={{ color: accent }} />
                          </div>
                        : <span style={{ fontSize: 11, fontWeight: 200, color: "rgba(255,255,255,0.2)" }}>اطلب</span>
                      }
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Help ── */}
        <div style={{
          borderRadius: 22,
          background: "rgba(255,255,255,0.04)",
          border: "0.5px solid rgba(255,255,255,0.07)",
          overflow: "hidden",
        }}>
          {[
            { icon: Phone, label: "الاستقبال",     sub: "متاح 24/7",              action: "اتصل" },
            { icon: Phone, label: "واتساب",        sub: "رد خلال دقيقتين",         action: "تواصل" },
          ].map((item, i, arr) => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 22px",
                borderBottom: i < arr.length - 1 ? "0.5px solid rgba(255,255,255,0.05)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <item.icon size={13} style={{ color: "rgba(255,255,255,0.28)" }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 200, color: "rgba(255,255,255,0.7)" }}>{item.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 200, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>{item.sub}</div>
                </div>
              </div>
              <button style={{
                padding: "6px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.06)",
                border: "0.5px solid rgba(255,255,255,0.1)",
                fontSize: 11, fontWeight: 200,
                color: "rgba(255,255,255,0.5)",
              }}>
                {item.action}
              </button>
            </div>
          ))}
        </div>

        {/* QLVIN watermark */}
        <div style={{ textAlign: "center", marginTop: 28, fontSize: 10, fontWeight: 100, letterSpacing: "0.35em", color: "rgba(255,255,255,0.06)" }}>
          QLVIN OS
        </div>
      </div>
    </div>
  );
}
