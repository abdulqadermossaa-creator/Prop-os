import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";

function OSLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/dashboard"
          element={
            <OSLayout>
              <Dashboard />
            </OSLayout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
