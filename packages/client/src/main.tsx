import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "@/hooks/useTheme";
import { OnlineProvider } from "@/hooks/useOnline";
import AppLayout from "@/App";
import { SWRegister } from "@/components/SWRegister";
import Dashboard from "@/pages/Dashboard";
import Dash from "@/pages/Dash";
import AddTask from "@/pages/AddTask";
import EditTask from "@/pages/EditTask";
import Settings from "@/pages/Settings";
import "./index.css";

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <OnlineProvider>
          <BrowserRouter>
            <SWRegister />
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="dash" element={<Dash />} />
                <Route path="add" element={<AddTask />} />
                <Route path="edit/:id" element={<EditTask />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </OnlineProvider>
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>
);
