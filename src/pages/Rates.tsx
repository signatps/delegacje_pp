import { useState } from "react";
import { Alert, Button, Field, Input, PageHeader, Table } from "../components/ui";
import { useAppData } from "../state/AppData";
import { importNbpTableA, saveManualRate } from "../services/nbp";

export function RatesPage() {
  const { domesticRates, foreignRates, mileageRates, exchangeRates, online, refresh } = useAppData();
  const [manual, setManual] = useState({ currency: "EUR", rate: "", effectiveDate: "", basis: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div>
      <PageHeader
        title="Stawki i kursy"
        subtitle="Wersjonowane stawki + NBP. Brak kursu dla daty = decyzja księgowości, bez cichego podstawiania."
        actions={
          <Button
            disabled={!online}
            onClick={async () => {
              setErr(null);
              try {
                const saved = await importNbpTableA();
                setMsg(`Pobrano ${saved.length} kursów z tabeli NBP A (${saved[0]?.tableNo}).`);
                await refresh();
              } catch (e) {
                setErr(e instanceof Error ? e.message : String(e));
              }
            }}
          >
            Pobierz kursy NBP (tabela A)
          </Button>
        }
      />

      <Alert tone="warn">
        Aktualne wartości seed wymagają weryfikacji względem Dziennika Ustaw / ELI i stron MF przed produkcją. Automatyczny import aktów prawnych
        nie jest wiarygodny bez zatwierdzenia — użyj kontrolowanego importu / ręcznej zmiany.
      </Alert>

      {msg ? <div className="mt-3"><Alert tone="info">{msg}</Alert></div> : null}
      {err ? <div className="mt-3"><Alert tone="danger">{err}</Alert></div> : null}

      <h2 className="mb-2 mt-6 font-semibold">Dieta krajowa</h2>
      <Table headers={["Kwota PLN", "Od", "Do", "Źródło", "Zatwierdzona"]}>
        {domesticRates.map((r) => (
          <tr key={r.id} className="border-t border-[var(--color-border)]">
            <td className="px-3 py-2">{r.amountPln}</td>
            <td className="px-3 py-2">{r.validFrom}</td>
            <td className="px-3 py-2">{r.validTo ?? "—"}</td>
            <td className="px-3 py-2">{r.source}</td>
            <td className="px-3 py-2">{r.approved ? "tak" : "nie"}</td>
          </tr>
        ))}
      </Table>

      <h2 className="mb-2 mt-6 font-semibold">Kilometrówka</h2>
      <Table headers={["Kategoria", "PLN/km", "Od", "Źródło"]}>
        {mileageRates.map((r) => (
          <tr key={r.id} className="border-t border-[var(--color-border)]">
            <td className="px-3 py-2">{r.category}</td>
            <td className="px-3 py-2">{r.amountPlnPerKm}</td>
            <td className="px-3 py-2">{r.validFrom}</td>
            <td className="px-3 py-2">{r.source}</td>
          </tr>
        ))}
      </Table>

      <h2 className="mb-2 mt-6 font-semibold">Diety zagraniczne</h2>
      <Table headers={["Kraj", "Waluta", "Dieta", "Limit noclegu", "Od"]}>
        {foreignRates.map((r) => (
          <tr key={r.id} className="border-t border-[var(--color-border)]">
            <td className="px-3 py-2">{r.countryName} ({r.countryCode})</td>
            <td className="px-3 py-2">{r.currency}</td>
            <td className="px-3 py-2">{r.dietAmount}</td>
            <td className="px-3 py-2">{r.lodgingLimit ?? "—"}</td>
            <td className="px-3 py-2">{r.validFrom}</td>
          </tr>
        ))}
      </Table>

      <h2 className="mb-2 mt-6 font-semibold">Kursy walut</h2>
      <Table headers={["Waluta", "Kurs", "Data", "Tabela", "Źródło", "Podstawa"]}>
        {exchangeRates.slice(0, 40).map((r) => (
          <tr key={r.id} className="border-t border-[var(--color-border)]">
            <td className="px-3 py-2">{r.currency}</td>
            <td className="px-3 py-2">{r.rate}</td>
            <td className="px-3 py-2">{r.effectiveDate}</td>
            <td className="px-3 py-2">{r.tableNo ?? "—"}</td>
            <td className="px-3 py-2">{r.source}</td>
            <td className="px-3 py-2">{r.basis ?? "—"}</td>
          </tr>
        ))}
      </Table>

      <div className="mt-6 max-w-xl space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--panel)] p-4">
        <h3 className="font-semibold">Ręczny kurs (wymaga uzasadnienia)</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Waluta">
            <Input value={manual.currency} onChange={(e) => setManual({ ...manual, currency: e.target.value })} />
          </Field>
          <Field label="Kurs">
            <Input value={manual.rate} onChange={(e) => setManual({ ...manual, rate: e.target.value })} />
          </Field>
          <Field label="Data">
            <Input type="date" value={manual.effectiveDate} onChange={(e) => setManual({ ...manual, effectiveDate: e.target.value })} />
          </Field>
          <Field label="Podstawa / źródło">
            <Input value={manual.basis} onChange={(e) => setManual({ ...manual, basis: e.target.value })} />
          </Field>
        </div>
        <Button
          variant="secondary"
          onClick={async () => {
            try {
              await saveManualRate(manual);
              setMsg("Zapisano kurs ręczny.");
              await refresh();
            } catch (e) {
              setErr(e instanceof Error ? e.message : String(e));
            }
          }}
        >
          Zapisz kurs ręczny
        </Button>
      </div>
    </div>
  );
}
