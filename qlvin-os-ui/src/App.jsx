import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Sidebar from "./components/layout/Sidebar";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import InvestorDeck from "./pages/InvestorDeck";
import Mobile from "./pages/Mobile";
import GuestCard from "./pages/GuestCard";

function OSLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      {children}
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route
          path="/dashboard"
          element={
            <OSLayout>
              <Dashboard />
            </OSLayout>
          }
        />
        <Route path="/investor" element={<InvestorDeck />} />
        <Route path="/mobile" element={<Mobile />} />
        <Route path="/guest" element={<GuestCard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
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
