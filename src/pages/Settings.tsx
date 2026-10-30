import { useEffect, useState } from "react";
import { Alert, Button, Field, Input, PageHeader, Select } from "../components/ui";
import { useAppData } from "../state/AppData";
import { getCompany, saveSettings, updateCompany } from "../data/repository";
import { exportDatabaseBackup, importDatabaseBackup, resetDatabase } from "../data/db";
import type { AppSettings, Company } from "../domain/types";
import { BRAND } from "../branding";

export function SettingsPage() {
  const { settings, refresh, company } = useAppData();
  const [local, setLocal] = useState<AppSettings | null>(settings);
  const [firm, setFirm] = useState<Company | null>(company);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setLocal(settings);
    setFirm(company);
  }, [settings, company]);

  if (!local || !firm) return null;

  return (
    <div>
      <PageHeader title="Ustawienia" subtitle="Firma, platformy, mapy, kopie zapasowe — praca jednostanowiskowa" />

      <Alert tone="warn">
        SQLite na jednym komputerze nie zapewnia współdzielenia ani centralnych uprawnień. Nie używaj bazy na udziale sieciowym dla wielu użytkowników.
        Logowanie lokalne chroni tylko przed przypadkowym dostępem na tej stacji — pełna autoryzacja wielostanowiskowa wymaga przyszłego serwera.
      </Alert>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--panel)] p-4">
          <h2 className="font-semibold">Dane pracodawcy</h2>
          <Field label="Nazwa">
            <Input value={firm.name} onChange={(e) => setFirm({ ...firm, name: e.target.value })} />
          </Field>
          <Field label="NIP">
            <Input value={firm.nip ?? ""} onChange={(e) => setFirm({ ...firm, nip: e.target.value })} />
          </Field>
          <Field label="Adres">
            <Input value={firm.address ?? ""} onChange={(e) => setFirm({ ...firm, address: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kod pocztowy">
              <Input value={firm.postalCode ?? ""} onChange={(e) => setFirm({ ...firm, postalCode: e.target.value })} />
            </Field>
            <Field label="Miasto">
              <Input value={firm.city ?? ""} onChange={(e) => setFirm({ ...firm, city: e.target.value })} />
            </Field>
          </div>
          <Field label="Prefiks numeracji">
            <Input value={firm.tripNumberPrefix} onChange={(e) => setFirm({ ...firm, tripNumberPrefix: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={firm.simplifyWorkflow}
              onChange={(e) => setFirm({ ...firm, simplifyWorkflow: e.target.checked })}
            />
            Uproszczony obieg zatwierdzeń
          </label>
          <p className="text-xs text-[var(--muted)]">
            KRS {BRAND.krs} · REGON {BRAND.regon} · {BRAND.email} · {BRAND.phone}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                await updateCompany(firm);
                await refresh();
                setMsg("Zapisano dane firmy.");
              }}
            >
              Zapisz firmę
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                setFirm({
                  ...firm,
                  name: BRAND.companyLegalName,
                  nip: BRAND.nip,
                  address: BRAND.address,
                  city: BRAND.city,
                  postalCode: BRAND.postalCode,
                  logoDataUrl: BRAND.logoPath,
                  tripNumberPrefix: BRAND.tripNumberPrefix,
                })
              }
            >
              Wczytaj dane Pro-PLUS SA
            </Button>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--panel)] p-4">
          <h2 className="font-semibold">Aplikacja i platformy</h2>
          <Field label="Motyw">
            <Select
              value={local.theme}
              onChange={(e) => {
                const theme = e.target.value as AppSettings["theme"];
                setLocal({ ...local, theme });
                localStorage.setItem("theme", theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme);
                document.documentElement.classList.toggle("dark", localStorage.getItem("theme") === "dark");
              }}
            >
              <option value="light">Jasny</option>
              <option value="dark">Ciemny</option>
              <option value="system">Systemowy</option>
            </Select>
          </Field>
          <Field label="Minimalna wersja Windows">
            <Input value={local.minWindowsVersion} onChange={(e) => setLocal({ ...local, minWindowsVersion: e.target.value })} />
          </Field>
          <Field label="Minimalna wersja macOS">
            <Input value={local.minMacosVersion} onChange={(e) => setLocal({ ...local, minMacosVersion: e.target.value })} />
          </Field>
          <p className="text-xs text-[var(--muted)]">
            Specyfikacja wspominała macOS 27+. Aktualnie ustawiono konfigurowalne minimum (domyślnie 14 / Sonoma), bo dostępność konkretnej wersji
            należy zweryfikować przed dystrybucją. Zmień wartość powyżej według polityki IT.
          </p>
          <Field label="Dostawca map / routingu">
            <Select
              value={local.mapProvider}
              onChange={(e) => setLocal({ ...local, mapProvider: e.target.value as AppSettings["mapProvider"] })}
            >
              <option value="osm">OpenStreetMap (darmowy: Photon + OSRM)</option>
              <option value="manual">Ręczny (offline)</option>
            </Select>
          </Field>
          <p className="text-xs text-[var(--muted)]">
            OSM nie wymaga klucza API. Adresy i trasa są wysyłane do publicznych serwisów (Photon/OSRM) — respektuj ich limity.
            Przy większym ruchu ustaw własny serwer routingu poniżej.
          </p>
          <Field label="Klucz API map (opcjonalnie, inne dostawcy)">
            <Input value={local.mapApiKey ?? ""} onChange={(e) => setLocal({ ...local, mapApiKey: e.target.value || null })} />
          </Field>
          <Field label="URL własnego serwera OSRM (opcjonalnie)">
            <Input
              placeholder="https://router.project-osrm.org"
              value={local.routingServerUrl ?? ""}
              onChange={(e) => setLocal({ ...local, routingServerUrl: e.target.value || null })}
            />
          </Field>
          <Button
            onClick={async () => {
              await saveSettings(local);
              await refresh();
              setMsg("Zapisano ustawienia.");
            }}
          >
            Zapisz ustawienia
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--panel)] p-4">
        <h2 className="font-semibold">Kopia zapasowa</h2>
        <p className="text-sm text-[var(--muted)]">
          Eksport obejmuje lokalną bazę SQLite (dane + załączniki zapisane w bazie). Hasła/API keys nie powinny być trzymane w repozytorium.
          Ostatnia kopia: {local.lastBackupAt ?? "brak"}.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={async () => {
              const blob = await exportDatabaseBackup();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `delegacje-pp-backup-${new Date().toISOString().slice(0, 10)}.sqlite`;
              a.click();
              URL.revokeObjectURL(url);
              await saveSettings({ ...local, lastBackupAt: new Date().toISOString() });
              await refresh();
              setMsg("Wyeksportowano kopię zapasową.");
            }}
          >
            Pobierz kopię SQLite
          </Button>
          <label className="inline-flex cursor-pointer items-center rounded-md border border-[var(--color-border)] px-3 py-2 text-sm">
            Przywróć z pliku
            <input
              type="file"
              accept=".sqlite,.db,application/octet-stream"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (!confirm("Przywrócenie zastąpi bieżące dane. Kontynuować? (zalecana kopia aktualnego stanu)")) return;
                await importDatabaseBackup(await f.arrayBuffer());
                await refresh();
                setMsg("Przywrócono bazę z kopii.");
              }}
            />
          </label>
          <Button
            variant="danger"
            onClick={async () => {
              if (!confirm("Usunąć wszystkie dane lokalne i wczytać seed? Dane demo też znikną.")) return;
              await resetDatabase();
              await getCompany();
              await refresh();
              setMsg("Zresetowano bazę do stanu początkowego.");
            }}
          >
            Reset bazy / usuń demo
          </Button>
        </div>
      </div>

      {msg ? <div className="mt-4"><Alert tone="info">{msg}</Alert></div> : null}
    </div>
  );
}
