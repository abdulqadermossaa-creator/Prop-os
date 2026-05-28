import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { PropertyStateProvider } from "./context/PropertyStateEngine.jsx";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PropertyStateProvider>
      <App />
    </PropertyStateProvider>
  </React.StrictMode>
);
