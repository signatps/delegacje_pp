import { Link } from "react-router-dom";
import { Alert, Badge, Button, Card, PageHeader } from "../components/ui";
import { useAppData } from "../state/AppData";
import { TRIP_STATUS_LABELS } from "../domain/types";
import { formatPln } from "../domain/money";
import { loadDemoScenario } from "../services/demoScenarios";
import { importNbpTableA } from "../services/nbp";

export function DashboardPage() {
  const { trips, expenses, advances, auditLog, online, refresh, domesticRates, mileageRates } = useAppData();

  const groups = {
    draft: trips.filter((t) => t.status === "draft"),
    pending: trips.filter((t) => t.status === "pending_approval"),
    planned: trips.filter((t) => t.status === "planned" || t.status === "approved"),
    active: trips.filter((t) => t.status === "in_progress"),
    settle: trips.filter((t) =>
      ["awaiting_settlement", "settlement_draft", "settlement_review", "settlement_returned"].includes(t.status),
    ),
    overdue: trips.filter((t) => {
      if (!["awaiting_settlement", "settlement_draft", "settlement_review"].includes(t.status)) return false;
      const end = new Date(t.actualEndAt ?? t.plannedEndAt);
      const due = new Date(end);
      due.setDate(due.getDate() + 14);
      return due < new Date();
    }),
  };

  const unpaidAdvances = advances.filter((a) => a.status === "paid" || a.status === "partially_settled");
  const recentExpenses = expenses.slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Pulpit"
        subtitle="Delegacje w toku, rozliczenia, zaliczki i aktualizacje stawek"
        actions={
          <>
            <Link to="/delegacje/nowa"><Button>Nowa delegacja</Button></Link>
            <Link to="/pracownicy"><Button variant="secondary">Nowy pracownik</Button></Link>
            <Link to="/koszty"><Button variant="secondary">Dodaj koszt</Button></Link>
            <Link to="/stawki"><Button variant="secondary">Aktualizuj stawki</Button></Link>
            <Link to="/raporty"><Button variant="ghost">Wygeneruj raport</Button></Link>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone={online ? "ok" : "warn"}>{online ? "Internet dostępny" : "Tryb offline"}</Badge>
        <Badge tone="accent">Dieta krajowa: {domesticRates[0]?.amountPln ?? "—"} PLN</Badge>
        <Badge tone="neutral">Km &gt;900: {mileageRates.find((m) => m.category === "powyzej_900")?.amountPlnPerKm ?? "—"} PLN</Badge>
      </div>

      <Alert tone="warn">
        Stawki seed (45 zł dieta, 0,89/1,15 zł/km) pochodzą ze specyfikacji bazowej i wymagają weryfikacji względem aktualnych przepisów przed użyciem produkcyjnym.
      </Alert>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ["W przygotowaniu", groups.draft.length],
          ["Do zatwierdzenia", groups.pending.length],
          ["Zaplanowane", groups.planned.length],
          ["Trwające", groups.active.length],
          ["Do rozliczenia", groups.settle.length],
          ["Po terminie", groups.overdue.length],
        ].map(([label, value]) => (
          <Card key={label as string} className="animate-fade-up">
            <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</div>
            <div className="mt-2 font-display text-4xl text-navy-900 dark:text-navy-100">{value as number}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Ostatnie koszty</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {recentExpenses.length === 0 ? (
              <li className="text-[var(--muted)]">Brak kosztów.</li>
            ) : (
              recentExpenses.map((e) => (
                <li key={e.id} className="flex justify-between gap-3 border-b border-[var(--color-border)] py-2 last:border-0">
                  <span>{e.description}</span>
                  <span className="font-medium">
                    {e.amount} {e.currency}
                  </span>
                </li>
              ))
            )}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold">Nierozliczone zaliczki (wypłacone)</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {unpaidAdvances.length === 0 ? (
              <li className="text-[var(--muted)]">Brak wypłaconych zaliczek do rozliczenia.</li>
            ) : (
              unpaidAdvances.map((a) => (
                <li key={a.id} className="flex justify-between gap-3 border-b border-[var(--color-border)] py-2 last:border-0">
                  <span>{a.status}</span>
                  <span className="font-medium">
                    {a.paidAmount ?? a.requestedAmount} {a.currency}
                  </span>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Delegacje wymagające uwagi</h2>
            <Link to="/delegacje" className="text-sm text-accent-600">
              Wszystkie
            </Link>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {[...groups.pending, ...groups.settle, ...groups.overdue].slice(0, 8).map((t) => (
              <li key={t.id}>
                <Link className="flex items-center justify-between gap-3 hover:text-accent-600" to={`/delegacje/${t.id}`}>
                  <span>
                    {t.number} — {t.purpose}
                  </span>
                  <Badge>{TRIP_STATUS_LABELS[t.status]}</Badge>
                </Link>
              </li>
            ))}
            {groups.pending.length + groups.settle.length + groups.overdue.length === 0 ? (
              <li className="text-[var(--muted)]">Brak pozycji.</li>
            ) : null}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold">Dane demonstracyjne</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Opcjonalne, oznaczone i usuwalne scenariusze A/B/C.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["A", "B", "C"] as const).map((s) => (
              <Button
                key={s}
                variant="secondary"
                onClick={async () => {
                  await loadDemoScenario(s);
                  await refresh();
                }}
              >
                Załaduj demo {s}
              </Button>
            ))}
            <Button
              variant="ghost"
              onClick={async () => {
                try {
                  await importNbpTableA();
                  await refresh();
                } catch (e) {
                  alert(e instanceof Error ? e.message : String(e));
                }
              }}
            >
              Pobierz kursy NBP
            </Button>
          </div>
          <div className="mt-4 text-xs text-[var(--muted)]">
            Ostatnie zdarzenia: {auditLog[0] ? `${auditLog[0].action} · ${auditLog[0].details}` : "—"}
          </div>
          <div className="mt-2 text-xs text-[var(--muted)]">Kwoty do wypłaty zależą od rozliczeń delegacji.</div>
          <div className="mt-1 text-sm font-medium">{formatPln(0)} (po wyliczeniu rozliczenia)</div>
        </Card>
      </div>
    </div>
  );
}
