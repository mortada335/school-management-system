// ─── App.tsx ──────────────────────────────────────────────────────────────────
// Global providers + route tree.
// Rule: no logic, no components — only wrap and delegate.

import { BrowserRouter } from "react-router-dom";
import { ThemeProvider }         from "@/contexts/ThemeContext";
import { I18nProvider }          from "@/lib/i18n";
import { AuthProvider }          from "@/contexts/AuthContext";
import { AcademicYearProvider }  from "@/contexts/AcademicYearContext";
import AppRoutes                 from "@/routes";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <AcademicYearProvider>
                <AppRoutes />
            </AcademicYearProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}