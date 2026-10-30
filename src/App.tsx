import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AppDataProvider } from "./state/AppData";
import { DashboardPage } from "./pages/Dashboard";
import { EmployeesPage } from "./pages/Employees";
import { VehiclesPage } from "./pages/Vehicles";
import { TripsPage } from "./pages/Trips";
import { TripWizardPage } from "./pages/TripWizard";
import { TripDetailPage } from "./pages/TripDetail";
import { ExpensesPage } from "./pages/Expenses";
import { AdvancesPage } from "./pages/Advances";
import { ReportsPage } from "./pages/Reports";
import { RatesPage } from "./pages/Rates";
import { SettingsPage } from "./pages/Settings";

export default function App() {
  return (
    <AppDataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="delegacje" element={<TripsPage />} />
            <Route path="delegacje/nowa" element={<TripWizardPage />} />
            <Route path="delegacje/:id" element={<TripDetailPage />} />
            <Route path="pracownicy" element={<EmployeesPage />} />
            <Route path="pojazdy" element={<VehiclesPage />} />
            <Route path="koszty" element={<ExpensesPage />} />
            <Route path="zaliczki" element={<AdvancesPage />} />
            <Route path="raporty" element={<ReportsPage />} />
            <Route path="stawki" element={<RatesPage />} />
            <Route path="ustawienia" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppDataProvider>
  );
}
