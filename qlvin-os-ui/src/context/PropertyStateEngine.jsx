import { createContext, useContext, useState } from "react";

export const STATES = [
  "VACANT", "BOOKED", "PREPARING", "GUEST_ARRIVING",
  "OCCUPIED", "SLEEP", "CHECKOUT_SOON", "CLEANING", "READY",
];

const SCENARIOS = {
  VACANT:        { accent: "#4ADE80", bg: "#040908", glow: "rgba(74,222,128,0.06)"  },
  BOOKED:        { accent: "#FB923C", bg: "#07090A", glow: "rgba(251,146,60,0.06)"  },
  PREPARING:     { accent: "#60A5FA", bg: "#050810", glow: "rgba(96,165,250,0.06)"  },
  GUEST_ARRIVING:{ accent: "#C8A96A", bg: "#080705", glow: "rgba(200,169,106,0.08)" },
  OCCUPIED:      { accent: "#C8A96A", bg: "#070705", glow: "rgba(200,169,106,0.07)" },
  SLEEP:         { accent: "#A78BFA", bg: "#030305", glow: "rgba(167,139,250,0.04)" },
  CHECKOUT_SOON: { accent: "#F87171", bg: "#0A0505", glow: "rgba(248,113,113,0.06)" },
  CLEANING:      { accent: "#A78BFA", bg: "#060608", glow: "rgba(167,139,250,0.05)" },
  READY:         { accent: "#4ADE80", bg: "#040907", glow: "rgba(74,222,128,0.05)"  },
};

const GUEST = {
  name: "أحمد العمري",
  type: "couple",
  partySize: 2,
  nights: 5,
  checkoutDate: "الجمعة 27 مايو",
  checkoutTime: "11:00 ص",
  unitId: "A-204",
  building: "برج القلوين",
};

const Ctx = createContext(null);

export function PropertyStateProvider({ children }) {
  const [propertyState, setPropertyState] = useState("OCCUPIED");
  return (
    <Ctx.Provider value={{ propertyState, setPropertyState, scenario: SCENARIOS[propertyState], guest: GUEST }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePropertyState() {
  return useContext(Ctx);
}

/* Dev picker — floating chip to switch states */
export function DevStatePicker() {
  const { propertyState, setPropertyState } = usePropertyState();
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-24 right-3 z-50 flex flex-col items-end gap-1.5">
      {open && STATES.map(s => (
        <button
          key={s}
          onClick={() => { setPropertyState(s); setOpen(false); }}
          style={{
            fontSize: 9,
            padding: "4px 10px",
            borderRadius: 20,
            background: s === propertyState ? "rgba(200,169,106,0.2)" : "rgba(0,0,0,0.75)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: s === propertyState ? "#C8A96A" : "rgba(255,255,255,0.5)",
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
          }}
        >
          {s}
        </button>
      ))}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(0,0,0,0.6)",
          border: "1px solid rgba(255,255,255,0.12)",
          fontSize: 13, color: "rgba(255,255,255,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        ⚙
      </button>
    </div>
  );
}
