import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Car,
  Receipt,
  Wallet,
  BarChart3,
  Coins,
  Settings,
  Search,
  Plus,
  Bell,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppData } from "../state/AppData";
import { Button, Input } from "./ui";
import { BRAND } from "../branding";

const NAV = [
  { to: "/", label: "Pulpit", icon: LayoutDashboard, end: true },
  { to: "/delegacje", label: "Delegacje", icon: Briefcase },
  { to: "/pracownicy", label: "Pracownicy", icon: Users },
  { to: "/pojazdy", label: "Pojazdy", icon: Car },
  { to: "/koszty", label: "Koszty", icon: Receipt },
  { to: "/zaliczki", label: "Zaliczki", icon: Wallet },
  { to: "/raporty", label: "Raporty", icon: BarChart3 },
  { to: "/stawki", label: "Stawki i kursy", icon: Coins },
  { to: "/ustawienia", label: "Ustawienia", icon: Settings },
];

export function AppShell() {
  const { ready, error, online, company, refresh } = useAppData();
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const brand = useMemo(() => company?.name ?? "Delegacje PP", [company]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", localStorage.getItem("theme") === "dark");
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-lg border border-red-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-red-800">Błąd uruchomienia</h1>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <Button className="mt-4" onClick={() => refresh()}>
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-pulse-soft rounded-full bg-accent-500" />
          <p className="mt-4 text-sm text-[var(--muted)]">Ładowanie lokalnej bazy SQLite…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[var(--sidebar)] text-[var(--sidebar-text)] md:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <img
            src={company?.logoDataUrl || BRAND.logoPath}
            alt={BRAND.companyShortName}
            className="mb-3 h-8 w-auto max-w-full object-contain object-left"
          />
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--brand-blue)]">{BRAND.productName}</div>
          <div className="mt-1 font-display text-xl font-semibold leading-tight">{brand}</div>
          <div className="mt-2 text-xs text-white/60">Praca jednostanowiskowa · offline-first</div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                  isActive ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/8 hover:text-white"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4 text-xs text-white/55">
          <div>{BRAND.city} · NIP {BRAND.nip}</div>
          <div className="mt-1">Windows 10/11 · macOS 14+ (Apple Silicon)</div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--panel)]/90 px-4 py-3 backdrop-blur">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 text-[var(--muted)]" size={16} />
            <Input
              className="pl-9"
              placeholder="Szukaj pracowników, delegacji, kosztów…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(`/delegacje?q=${encodeURIComponent(q)}`);
              }}
            />
          </div>
          <Button onClick={() => navigate("/delegacje/nowa")}>
            <Plus size={16} /> Nowa delegacja
          </Button>
          <div className="hidden items-center gap-2 text-xs text-[var(--muted)] sm:flex">
            {online ? <Wifi size={16} className="text-accent-600" /> : <WifiOff size={16} className="text-amber-600" />}
            {online ? "Online" : "Offline"}
          </div>
          <button className="rounded-md p-2 text-[var(--muted)] hover:bg-[var(--color-surface-muted)]" aria-label="Powiadomienia">
            <Bell size={18} />
          </button>
          <div className="hidden rounded-md bg-[var(--color-surface-muted)] px-3 py-1.5 text-sm sm:block">Admin</div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">
          <div className="animate-fade-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
