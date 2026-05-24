import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import AmbientScreen    from "./pages/AmbientScreen";
import WelcomeScene     from "./pages/WelcomeScene";
import GuestPortal      from "./pages/GuestPortal";
import MatchMode        from "./pages/MatchMode";
import SleepMode        from "./pages/SleepMode";
import CheckoutMode     from "./pages/CheckoutMode";
import FounderDashboard from "./pages/FounderDashboard";
import HostDashboard    from "./pages/HostDashboard";
import InvestorDeck     from "./pages/InvestorDeck";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Ambient OS — tablet/property interface */}
        <Route path="/"          element={<AmbientScreen />} />
        <Route path="/welcome"   element={<WelcomeScene />} />
        <Route path="/guest"     element={<GuestPortal />} />
        <Route path="/match"     element={<MatchMode />} />
        <Route path="/sleep"     element={<SleepMode />} />
        <Route path="/checkout"  element={<CheckoutMode />} />

        {/* Admin */}
        <Route path="/dashboard" element={<FounderDashboard />} />
        <Route path="/host"      element={<HostDashboard />} />
        <Route path="/investor"  element={<InvestorDeck />} />

        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
