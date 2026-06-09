import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import {
  isLoggedIn, clearAuth, getUserEmail,
  login, register,
  updateProfile, getUserTimezone,
} from "@/lib/sync";
import type { ThemeMode } from "@/lib/types";

const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

// --- Cloud auth section ---
function CloudAuthSection() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [timezone, setTimezone] = useState(() => getUserTimezone());
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [tzFeedback, setTzFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  return (
    <div className="space-y-4">
      {/* Auth section */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        {loggedIn ? (
          <div>
            <p className="text-sm text-green-600 dark:text-green-400">
              Conectado como {getUserEmail()}
            </p>
            <button
              onClick={() => { clearAuth(); setLoggedIn(false); }}
              className="mt-2 text-sm text-red-500 hover:underline"
            >
              Cerrar sesion
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Toggle login/register */}
            <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
              <button
                onClick={() => setAuthMode("login")}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs transition-colors ${
                  authMode === "login"
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-400"
                    : "text-gray-500"
                }`}
              >
                Iniciar sesion
              </button>
              <button
                onClick={() => setAuthMode("register")}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs transition-colors ${
                  authMode === "register"
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-400"
                    : "text-gray-500"
                }`}
              >
                Registrarse
              </button>
            </div>

            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800"
            />
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Contrasena"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800"
            />

            {authError && (
              <p className="text-xs text-red-500">{authError}</p>
            )}

            <button
              onClick={async () => {
                setAuthError("");
                const fn = authMode === "login" ? login : register;
                const result = await fn(authEmail, authPassword);
                if (result.ok) {
                  setLoggedIn(true);
                  setAuthEmail("");
                  setAuthPassword("");
                } else {
                  setAuthError(result.error || "Error");
                }
              }}
              disabled={!authEmail || !authPassword}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {authMode === "login" ? "Iniciar sesion" : "Crear cuenta"}
            </button>
          </div>
        )}
      </div>

      {/* Timezone selector */}
      {loggedIn && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <label className="text-sm text-gray-500 dark:text-gray-400">Zona horaria</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
          >
            <option value="">Automatica (navegador)</option>
            <option value="America/Santiago">America/Santiago</option>
            <option value="America/Buenos_Aires">America/Buenos_Aires</option>
            <option value="America/Lima">America/Lima</option>
            <option value="America/Bogota">America/Bogota</option>
            <option value="America/Mexico_City">America/Mexico_City</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Europe/Madrid">Europe/Madrid</option>
            <option value="UTC">UTC</option>
          </select>
          <button
            onClick={async () => {
              const success = await updateProfile({ timezone });
              if (success) {
                setTzFeedback({ type: "success", message: "Zona horaria guardada" });
              } else {
                setTzFeedback({ type: "error", message: "Error al guardar la zona horaria" });
              }
              setTimeout(() => {
                setTzFeedback(null);
              }, 5000);
            }}
            className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Guardar zona horaria
          </button>
          {tzFeedback && (
            <p className={`mt-2 text-xs ${tzFeedback.type === "success" ? "text-green-600" : "text-red-500"}`}>
              {tzFeedback.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// --- Main Settings component ---
export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-5">
      <Helmet>
        <title>Todo List - Ajustes</title>
      </Helmet>

      <h1 className="text-xl font-bold">Ajustes</h1>

      {/* --- Cloud auth + Timezone --- */}
      <CloudAuthSection />

      {/* --- Tema --- */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="mb-3 text-sm font-medium text-gray-500">Tema</p>
        <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-colors ${
                  theme === opt.value
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-400"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Icon size={14} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm font-medium text-gray-500">Todo List</p>
        <p className="mt-1 text-xs text-gray-400">v1.0.0</p>
        <p className="text-xs text-gray-400">
          Control de tareas personal. React + SQLite + PWA.
        </p>
      </div>

      <div className="h-20" />
    </div>
  );
}
