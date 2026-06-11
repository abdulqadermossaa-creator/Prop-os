import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Plus, RefreshCw } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { DevStatePicker } from "../context/PropertyStateEngine";

const supabase = createClient(
  "https://nrekvofyypdifqfghhnh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZWt2b2Z5eXBkaWZxZmdoaG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0OTU2OTQsImV4cCI6MjA5NjA3MTY5NH0.C-KTMzXBntvuOIkiTACZPR1Bv5FTQuw57j5XfNA7LRk"
);

const STATE_MAP = {
  approved:         { ar: "جاهزة",          color: "#4ADE80" },
  pending_approval: { ar: "بانتظار الموافقة", color: "#FB923C" },
  suspended:        { ar: "موقوفة",          color: "#F87171" },
  inactive:         { ar: "معطلة",           color: "#A78BFA" },
};

export default function FounderDashboard() {
  const navigate = useNavigate();
  const [hosts, setHosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState({ name: "", phone: "", unitName: "" });
  const [saving, setSaving]     = useState(false);

  async function loadData() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("users")
      .select(`
        id, name, phone, status, created_at,
        units (
          id, name, location, status, pi_connected,
          guest_sessions ( id, guest_name, check_in, check_out )
        )
      `)
      .eq("role", "host")
      .order("created_at", { ascending: false });

    if (error) { setError(error.message); }
    else       { setHosts(data || []); }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function addHost(e) {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSaving(true);

    const { data: newHost, error: he } = await supabase
      .from("users")
      .insert({ name: form.name, phone: form.phone, role: "host", status: "active" })
      .select("id, name").single();

    if (he) { alert("خطأ: " + he.message); setSaving(false); return; }

    const { data: newUnit, error: ue } = await supabase
      .from("units")
      .insert({ host_id: newHost.id, name: form.unitName || `شقة ${form.name}`, status: "pending_approval" })
      .select("id").single();

    if (!ue) {
      await supabase.from("events").insert({
        unit_id: newUnit.id, event_type: "host_added", actor_type: "founder",
        payload: { host_name: form.name, phone: form.phone },
      });
    }

    setSaving(false);
    setShowAdd(false);
    setForm({ name: "", phone: "", unitName: "" });
    loadData();
  }

  const allUnits    = hosts.flatMap(h => h.units || []);
  const now         = new Date();
  const activeHosts = hosts.filter(h => h.status !== "suspended").length;
  const piOnline    = allUnits.filter(u => u.pi_connected).length;
  const activeGuests = allUnits.reduce((acc, u) =>
    acc + (u.guest_sessions?.filter(s =>
      new Date(s.check_in) <= now && new Date(s.check_out) >= now
    ).length || 0), 0);

  const KPIS = [
    { label: "ملاك نشطين",    value: activeHosts,        sub: `من ${hosts.length} مسجلين`,   color: "#C8A96A" },
    { label: "إجمالي الوحدات", value: allUnits.length,    sub: `${piOnline} Pi متصل`,         color: "#60A5FA" },
    { label: "ضيوف نشطين",    value: activeGuests,       sub: "الآن",                         color: "#4ADE80" },
    { label: "بانتظار موافقة", value: allUnits.filter(u => u.status === "pending_approval").length, sub: "وحدة", color: "#FB923C" },
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col" style={{ background: "#06080C" }}>
      <div className="absolute pointer-events-none" style={{
        top: 0, right: 0, width: "40vw", height: "40vh",
        background: "radial-gradient(circle at top right, rgba(47,128,255,0.04) 0%, transparent 70%)",
      }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-9 pt-9 pb-7">
        <div>
          <div style={{ fontSize: 10, fontWeight: 200, letterSpacing: "0.35em", color: "rgba(255,255,255,0.18)", marginBottom: 6 }}>
            QLVIN OS
          </div>
          <div style={{ fontSize: 24, fontWeight: 100, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em" }}>
            Mission Control
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={loadData}
            style={{ padding: "8px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
          >
            <RefreshCw size={12} />
          </button>
          <button
            onClick={() => setShowAdd(true)}
            style={{ padding: "8px 16px", borderRadius: 12, background: "rgba(200,169,106,0.12)", border: "0.5px solid rgba(200,169,106,0.25)", fontSize: 12, fontWeight: 400, color: "#C8A96A", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={12} /> مالك جديد
          </button>
          {[{ label: "الواجهة الرئيسية", path: "/" }, { label: "Host View", path: "/host" }].map(b => (
            <button key={b.path} onClick={() => navigate(b.path)}
              style={{ padding: "8px 16px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", fontSize: 12, fontWeight: 200, color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-9 pb-9" style={{ scrollbarWidth: "none" }}>
        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
          {KPIS.map((kpi, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.7 }}
              style={{ padding: "22px 20px", borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)" }}
            >
              <div style={{ fontSize: 11, fontWeight: 200, color: "rgba(255,255,255,0.28)", marginBottom: 10 }}>{kpi.label}</div>
              <div style={{ fontSize: 28, fontWeight: 100, color: kpi.color, letterSpacing: "-0.03em", marginBottom: 6 }}>{kpi.value}</div>
              <div style={{ fontSize: 10, fontWeight: 200, color: "rgba(255,255,255,0.18)" }}>{kpi.sub}</div>
            </motion.div>
          ))}
        </div>

        <div style={{ fontSize: 10, fontWeight: 200, letterSpacing: "0.35em", color: "rgba(255,255,255,0.18)", marginBottom: 14 }}>
          الملاك والوحدات
        </div>

        {/* Loading / Error */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
            ⏳ جاري تحميل البيانات...
          </div>
        )}
        {error && (
          <div style={{ padding: "14px 18px", borderRadius: 16, background: "rgba(248,113,113,0.05)", border: "0.5px solid rgba(248,113,113,0.12)", color: "#F87171", fontSize: 12 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Hosts Grid */}
        {!loading && !error && hosts.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏠</div>
            لا يوجد ملاك بعد — اضغط "مالك جديد"
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {hosts.flatMap(host =>
            (host.units || []).map((unit, i) => {
              const s   = STATE_MAP[unit.status] || { ar: unit.status, color: "#64748b" };
              const now = new Date();
              const activeSession = unit.guest_sessions?.find(s =>
                new Date(s.check_in) <= now && new Date(s.check_out) >= now
              );
              return (
                <motion.div key={unit.id}
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.04, duration: 0.6 }}
                  style={{
                    padding: "20px", borderRadius: 20,
                    background: "rgba(255,255,255,0.03)",
                    border: "0.5px solid rgba(255,255,255,0.06)",
                    borderLeft: `2px solid ${s.color}60`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <motion.span
                      animate={unit.status === "approved" ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
                      transition={{ duration: 2.8, repeat: Infinity }}
                      style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 10, fontWeight: 400, color: s.color }}>{s.ar}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 100, color: "rgba(255,255,255,0.9)", marginBottom: 2 }}>{unit.name}</div>
                  <div style={{ fontSize: 10, fontWeight: 200, color: "rgba(255,255,255,0.25)", marginBottom: 8 }}>{host.name}</div>
                  <div style={{ fontSize: 11, fontWeight: 200, color: "rgba(255,255,255,0.35)" }}>
                    {activeSession?.guest_name || "—"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
                    <span style={{ fontSize: 9, color: unit.pi_connected ? "#4ADE80" : "#F87171" }}>
                      {unit.pi_connected ? "● Pi متصل" : "● Pi مفصول"}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Host Modal */}
      {showAdd && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
          backdropFilter: "blur(8px)",
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ width: "90%", maxWidth: 360, background: "#0a0a14", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: 28 }}
          >
            <div style={{ fontSize: 16, fontWeight: 300, color: "#fff", marginBottom: 20 }}>➕ مالك جديد</div>
            <form onSubmit={addHost}>
              {[
                { id: "name",     label: "اسم المالك *",     placeholder: "محمد العتيبي" },
                { id: "phone",    label: "رقم الجوال *",     placeholder: "+966501234567" },
                { id: "unitName", label: "اسم الوحدة الأولى", placeholder: "شقة الملقا" },
              ].map(f => (
                <div key={f.id} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 5 }}>{f.label}</div>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    value={form[f.id]}
                    onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))}
                    style={{ width: "100%", padding: "11px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff", fontSize: 13, fontFamily: "Tajawal, sans-serif", outline: "none" }}
                  />
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  style={{ flex: 1, padding: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13 }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ flex: 2, padding: 12, background: saving ? "rgba(200,169,106,0.3)" : "#C8A96A", border: "none", borderRadius: 12, color: "#000", cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}
                >
                  {saving ? "جاري الإضافة..." : "✓ إضافة"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <DevStatePicker />
    </div>
  );
}
