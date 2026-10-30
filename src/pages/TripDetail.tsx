import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { v4 as uuid } from "uuid";
import { Alert, Badge, Button, Field, Input, PageHeader, Select, Table, Textarea } from "../components/ui";
import { useAppData } from "../state/AppData";
import {
  currentDomesticDietRate,
  currentMileageRate,
  getSettlementForTrip,
  latestExchangeMap,
  listAdvances,
  listExpenses,
  saveAdvance,
  saveExpense,
  saveSettlement,
  setTripStatus,
  saveTrip,
} from "../data/repository";
import { calculateSettlement } from "../domain/settlement";
import { TRIP_STATUS_LABELS, TRANSPORT_LABELS, type Advance, type Expense, type TripStatus } from "../domain/types";
import { formatPln } from "../domain/money";
import { downloadPdf, generateMileageLogPdf, generateSettlementPdf, generateTripOrderPdf } from "../services/pdf";
import { getCompany } from "../data/repository";

const TABS = [
  "Podstawowe",
  "Trasa",
  "Diety",
  "Noclegi",
  "Koszty",
  "Zaliczki",
  "Rozliczenie",
  "Dokumenty",
  "Historia",
] as const;

export function TripDetailPage() {
  const { id } = useParams();
  const { trips, employees, vehicles, foreignRates, refresh, auditLog } = useAppData();
  const trip = trips.find((t) => t.id === id);
  const employee = employees.find((e) => e.id === trip?.employeeId);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Podstawowe");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [settlementInfo, setSettlementInfo] = useState<Awaited<ReturnType<typeof calculateSettlement>> | null>(null);
  const [explainId, setExplainId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      setExpenses(await listExpenses(id));
      setAdvances(await listAdvances(id));
      const existing = await getSettlementForTrip(id);
      if (existing) {
        setSettlementInfo({
          lines: existing.lines,
          totalDueBeforeAdvance: existing.totalDueBeforeAdvance,
          advancesPaid: existing.advancesPaid,
          amountToPayOrReturn: existing.amountToPayOrReturn,
          companyPaidCosts: existing.companyPaidCosts,
          dueAt: existing.dueAt ?? "",
          summaryExplanation: "",
          _debug: "0",
        });
      }
    })();
  }, [id, trips]);

  const vehicle = useMemo(() => {
    const vid = trip?.segments[0]?.vehicleId;
    return vehicles.find((v) => v.id === vid) ?? null;
  }, [trip, vehicles]);

  if (!trip || !employee) {
    return (
      <div>
        <Alert tone="danger">Nie znaleziono delegacji.</Alert>
        <Link to="/delegacje" className="mt-3 inline-block text-accent-600">
          Wróć do listy
        </Link>
      </div>
    );
  }

  async function changeStatus(status: TripStatus) {
    await setTripStatus(trip!.id, status, `Zmiana statusu na ${status}`);
    await refresh();
    setMsg(`Status: ${TRIP_STATUS_LABELS[status]}`);
  }

  async function runSettlement() {
    const start = trip!.actualStartAt ?? trip!.plannedStartAt;
    const end = trip!.actualEndAt ?? trip!.plannedEndAt;
    const domestic = await currentDomesticDietRate();
    if (!domestic) throw new Error("Brak zatwierdzonej stawki diety krajowej");
    const rates = await latestExchangeMap();
    const meals = trip!.meals[0];
    const foreign = trip!.isForeign
      ? foreignRates.find((r) => r.countryCode === (trip!.destinations.find((d) => !d.isTransit)?.countryCode ?? "BG"))
      : null;

    let mileage = null as null | Parameters<typeof calculateSettlement>[0]["mileage"];
    if (vehicle && trip!.segments.some((s) => s.transportMode === "private_car")) {
      const rate = await currentMileageRate(vehicle.engineCategory);
      const km = trip!.segments.reduce((acc, s) => acc + Number(s.actualDistanceKm ?? s.plannedDistanceKm ?? 0), 0);
      mileage = {
        acceptedKm: String(km),
        ratePlnPerKm: rate?.amountPlnPerKm ?? "0",
        vehicleKind: vehicle.kind,
        engineCategory: vehicle.engineCategory,
        customRate: vehicle.customMileageRate,
        customRateBasis: vehicle.customRateBasis,
      };
    }

    const result = calculateSettlement({
      tripId: trip!.id,
      actualStartAt: start,
      actualEndAt: end,
      isForeign: trip!.isForeign,
      foreignDietRate: foreign?.dietAmount,
      foreignCurrency: foreign?.currency,
      domesticDietRatePln: domestic.amountPln,
      breakfastCount: meals?.breakfast ? 1 : 0,
      lunchCount: meals?.lunch ? 1 : 0,
      dinnerCount: meals?.dinner ? 1 : 0,
      dietDisabled: trip!.dietDisabled,
      mileage,
      expenses,
      advances,
      exchangeRates: rates,
    });
    setSettlementInfo(result);
    const now = new Date().toISOString();
    await saveSettlement({
      id: uuid(),
      tripId: trip!.id,
      status: "draft",
      dueAt: result.dueAt,
      totalDueBeforeAdvance: result.totalDueBeforeAdvance,
      advancesPaid: result.advancesPaid,
      amountToPayOrReturn: result.amountToPayOrReturn,
      companyPaidCosts: result.companyPaidCosts,
      lines: result.lines,
      createdAt: now,
      updatedAt: now,
    });
    await setTripStatus(trip!.id, "settlement_draft", "Wygenerowano rozliczenie");
    await refresh();
    setTab("Rozliczenie");
  }

  async function addExpense() {
    if (!trip) return;
    const exp: Expense = {
      id: uuid(),
      tripId: trip.id,
      date: new Date().toISOString().slice(0, 10),
      category: "inne",
      description: "Nowy koszt",
      amount: "0.00",
      currency: "PLN",
      countryCode: trip.isForeign ? trip.destinations[0]?.countryCode ?? "PL" : "PL",
      vendor: null,
      documentNumber: null,
      vatAmount: null,
      paymentMethod: null,
      paidBy: "employee",
      refundAmount: "0.00",
      accepted: true,
      comment: null,
      withoutReceipt: false,
      withoutReceiptStatement: null,
      attachmentIds: [],
      createdAt: new Date().toISOString(),
    };
    await saveExpense(exp);
    setExpenses(await listExpenses(trip.id));
    await refresh();
  }

  async function addAdvance() {
    if (!trip) return;
    const adv: Advance = {
      id: uuid(),
      tripId: trip.id,
      requestedAmount: "100.00",
      currency: "PLN",
      status: "requested",
      approvedAmount: null,
      paidAmount: null,
      paidAt: null,
      notes: null,
      createdAt: new Date().toISOString(),
    };
    await saveAdvance(adv);
    setAdvances(await listAdvances(trip.id));
    await refresh();
  }

  return (
    <div>
      <PageHeader
        title={trip.number}
        subtitle={trip.purpose}
        actions={
          <>
            <Badge>{TRIP_STATUS_LABELS[trip.status]}</Badge>
            {trip.status === "pending_approval" ? (
              <>
                <Button onClick={() => void changeStatus("approved")}>Zatwierdź</Button>
                <Button variant="danger" onClick={() => void changeStatus("rejected")}>Odrzuć</Button>
              </>
            ) : null}
            {trip.status === "approved" ? <Button onClick={() => void changeStatus("planned")}>Zaplanuj</Button> : null}
            {trip.status === "planned" ? <Button onClick={() => void changeStatus("in_progress")}>Rozpocznij</Button> : null}
            {trip.status === "in_progress" ? (
              <Button
                onClick={async () => {
                  const updated = {
                    ...trip,
                    actualStartAt: trip.actualStartAt ?? trip.plannedStartAt,
                    actualEndAt: new Date().toISOString().slice(0, 19),
                    status: "awaiting_settlement" as const,
                  };
                  await saveTrip(updated);
                  await refresh();
                }}
              >
                Zakończ i rozlicz
              </Button>
            ) : null}
            {["awaiting_settlement", "settlement_draft", "settlement_returned"].includes(trip.status) ? (
              <Button onClick={() => void runSettlement().catch((e) => setMsg(String(e)))}>Policz rozliczenie</Button>
            ) : null}
          </>
        }
      />

      {msg ? <div className="mb-4"><Alert tone="info">{msg}</Alert></div> : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-sm ${tab === t ? "bg-navy-900 text-white" : "bg-[var(--color-surface-muted)] text-[var(--muted)]"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Podstawowe" && (
        <div className="grid gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--panel)] p-4 md:grid-cols-2">
          <div><div className="text-xs text-[var(--muted)]">Pracownik</div><div className="font-medium">{employee.firstName} {employee.lastName}</div></div>
          <div><div className="text-xs text-[var(--muted)]">Stanowisko</div><div>{employee.position ?? "—"}</div></div>
          <div><div className="text-xs text-[var(--muted)]">Okres planowany</div><div>{trip.plannedStartAt.replace("T", " ").slice(0, 16)} — {trip.plannedEndAt.replace("T", " ").slice(0, 16)}</div></div>
          <div><div className="text-xs text-[var(--muted)]">Okres rzeczywisty</div><div>{(trip.actualStartAt ?? "—").toString().replace("T", " ").slice(0, 16)} — {(trip.actualEndAt ?? "—").toString().replace("T", " ").slice(0, 16)}</div></div>
          <div className="md:col-span-2"><div className="text-xs text-[var(--muted)]">Opis</div><div>{trip.description ?? "—"}</div></div>
          {trip.dietDisabled ? <Alert tone="warn">Diety wyłączone: {trip.dietDisabledReason}</Alert> : null}
          <div className="md:col-span-2 grid gap-2 md:grid-cols-2">
            <Field label="Rzeczywisty początek">
              <Input
                type="datetime-local"
                value={(trip.actualStartAt ?? trip.plannedStartAt).slice(0, 16)}
                onChange={async (e) => {
                  await saveTrip({ ...trip, actualStartAt: e.target.value });
                  await refresh();
                }}
              />
            </Field>
            <Field label="Rzeczywisty koniec">
              <Input
                type="datetime-local"
                value={(trip.actualEndAt ?? trip.plannedEndAt).slice(0, 16)}
                onChange={async (e) => {
                  await saveTrip({ ...trip, actualEndAt: e.target.value });
                  await refresh();
                }}
              />
            </Field>
          </div>
        </div>
      )}

      {tab === "Trasa" && (
        <Table headers={["Od", "Do", "Transport", "Plan km", "Rzeczywiste km", "Różnica"]}>
          {trip.segments.map((s) => {
            const plan = Number(s.plannedDistanceKm ?? 0);
            const act = Number(s.actualDistanceKm ?? 0);
            return (
              <tr key={s.id} className="border-t border-[var(--color-border)]">
                <td className="px-3 py-2">{s.fromPlace}</td>
                <td className="px-3 py-2">{s.toPlace}</td>
                <td className="px-3 py-2">{TRANSPORT_LABELS[s.transportMode]}</td>
                <td className="px-3 py-2">{s.plannedDistanceKm ?? "—"}</td>
                <td className="px-3 py-2">{s.actualDistanceKm ?? "—"}</td>
                <td className="px-3 py-2">
                  {s.plannedDistanceKm && s.actualDistanceKm
                    ? `${(act - plan).toFixed(1)} km (${plan ? (((act - plan) / plan) * 100).toFixed(1) : "0"}%)`
                    : "—"}
                  {s.distanceDiffReason ? <div className="text-xs text-[var(--muted)]">{s.distanceDiffReason}</div> : null}
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {tab === "Diety" && (
        <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--panel)] p-4">
          {trip.meals.map((m) => (
            <div key={m.id} className="text-sm">
              <div className="font-medium">{m.periodLabel}</div>
              <div>Śniadanie: {m.breakfast ? "tak" : "nie"} · Obiad: {m.lunch ? "tak" : "nie"} · Kolacja: {m.dinner ? "tak" : "nie"}</div>
            </div>
          ))}
          <Alert tone="info">Pełne wyliczenie diet zobaczysz w zakładce Rozliczenie („Jak obliczono?”).</Alert>
        </div>
      )}

      {tab === "Noclegi" && (
        trip.accommodations.length === 0 ? (
          <Alert tone="info">Brak noclegów.</Alert>
        ) : (
          <Table headers={["Miejsce", "Noce", "Kwota", "Limit", "Płatnik"]}>
            {trip.accommodations.map((a) => (
              <tr key={a.id} className="border-t border-[var(--color-border)]">
                <td className="px-3 py-2">{a.place} ({a.countryCode})</td>
                <td className="px-3 py-2">{a.nights}</td>
                <td className="px-3 py-2">{a.amount} {a.currency}</td>
                <td className="px-3 py-2">{a.withinLimit ? "OK" : a.overLimitApproved ? "Przekroczenie za zgodą" : "Przekroczenie"}</td>
                <td className="px-3 py-2">{a.paidBy}</td>
              </tr>
            ))}
          </Table>
        )
      )}

      {tab === "Koszty" && (
        <div className="space-y-3">
          <Button onClick={() => void addExpense()}>Dodaj koszt</Button>
          <Table headers={["Data", "Kategoria", "Opis", "Kwota", "Płatnik", "Zwrot", ""]}>
            {expenses.map((e) => (
              <tr key={e.id} className="border-t border-[var(--color-border)]">
                <td className="px-3 py-2">{e.date}</td>
                <td className="px-3 py-2">{e.category}</td>
                <td className="px-3 py-2">
                  <Input
                    value={e.description}
                    onChange={async (ev) => {
                      const next = { ...e, description: ev.target.value };
                      await saveExpense(next);
                      setExpenses(await listExpenses(trip.id));
                    }}
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <Input
                      className="w-24"
                      value={e.amount}
                      onChange={async (ev) => {
                        const next = { ...e, amount: ev.target.value, refundAmount: e.paidBy === "employee" ? ev.target.value : "0.00" };
                        await saveExpense(next);
                        setExpenses(await listExpenses(trip.id));
                      }}
                    />
                    <Select
                      className="w-24"
                      value={e.currency}
                      onChange={async (ev) => {
                        await saveExpense({ ...e, currency: ev.target.value });
                        setExpenses(await listExpenses(trip.id));
                      }}
                    >
                      {["PLN", "EUR", "USD", "GBP"].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </Select>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <Select
                    value={e.paidBy}
                    onChange={async (ev) => {
                      const paidBy = ev.target.value as Expense["paidBy"];
                      await saveExpense({
                        ...e,
                        paidBy,
                        refundAmount: paidBy === "employee" || paidBy === "advance" ? e.amount : "0.00",
                      });
                      setExpenses(await listExpenses(trip.id));
                    }}
                  >
                    <option value="employee">Pracownik</option>
                    <option value="company">Firma</option>
                    <option value="company_card">Karta służbowa</option>
                    <option value="advance">Zaliczka</option>
                  </Select>
                </td>
                <td className="px-3 py-2">{e.refundAmount}</td>
                <td className="px-3 py-2">
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={e.withoutReceipt}
                      onChange={async (ev) => {
                        if (ev.target.checked && !e.withoutReceiptStatement) {
                          const statement = prompt("Oświadczenie o braku dokumentu (wymagane):") ?? "";
                          if (!statement.trim()) return;
                          await saveExpense({ ...e, withoutReceipt: true, withoutReceiptStatement: statement });
                        } else {
                          await saveExpense({ ...e, withoutReceipt: ev.target.checked });
                        }
                        setExpenses(await listExpenses(trip.id));
                      }}
                    />
                    bez rachunku
                  </label>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}

      {tab === "Zaliczki" && (
        <div className="space-y-3">
          <Button onClick={() => void addAdvance()}>Wniosek o zaliczkę</Button>
          <Alert tone="info">Niewypłaconej zaliczki nie traktuje się jako przekazanej.</Alert>
          <Table headers={["Wnioskowana", "Status", "Wypłacona", "Data wypłaty", "Akcje"]}>
            {advances.map((a) => (
              <tr key={a.id} className="border-t border-[var(--color-border)]">
                <td className="px-3 py-2">{a.requestedAmount} {a.currency}</td>
                <td className="px-3 py-2">{a.status}</td>
                <td className="px-3 py-2">{a.paidAmount ?? "—"}</td>
                <td className="px-3 py-2">{a.paidAt ?? "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        await saveAdvance({ ...a, status: "approved", approvedAmount: a.requestedAmount });
                        setAdvances(await listAdvances(trip.id));
                        await refresh();
                      }}
                    >
                      Zatwierdź
                    </Button>
                    <Button
                      onClick={async () => {
                        await saveAdvance({
                          ...a,
                          status: "paid",
                          approvedAmount: a.approvedAmount ?? a.requestedAmount,
                          paidAmount: a.approvedAmount ?? a.requestedAmount,
                          paidAt: new Date().toISOString().slice(0, 10),
                        });
                        setAdvances(await listAdvances(trip.id));
                        await refresh();
                      }}
                    >
                      Wypłać
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}

      {tab === "Rozliczenie" && (
        <div className="space-y-4">
          {!settlementInfo ? (
            <Alert tone="info">Brak rozliczenia — użyj „Policz rozliczenie”.</Alert>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--panel)] p-3">
                  <div className="text-xs text-[var(--muted)]">Przed zaliczką</div>
                  <div className="font-display text-2xl">{formatPln(settlementInfo.totalDueBeforeAdvance)}</div>
                </div>
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--panel)] p-3">
                  <div className="text-xs text-[var(--muted)]">Zaliczki wypłacone</div>
                  <div className="font-display text-2xl">{formatPln(settlementInfo.advancesPaid)}</div>
                </div>
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--panel)] p-3">
                  <div className="text-xs text-[var(--muted)]">Do wypłaty / zwrotu</div>
                  <div className="font-display text-2xl">{formatPln(settlementInfo.amountToPayOrReturn)}</div>
                </div>
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--panel)] p-3">
                  <div className="text-xs text-[var(--muted)]">Koszty firmy</div>
                  <div className="font-display text-2xl">{formatPln(settlementInfo.companyPaidCosts)}</div>
                </div>
              </div>
              {settlementInfo.dueAt ? <Alert tone="warn">Termin rozliczenia: {settlementInfo.dueAt.slice(0, 10)} (domyślnie 14 dni od zakończenia)</Alert> : null}
              <Table headers={["Pozycja", "Kwota", "Waluta", "PLN", ""]}>
                {settlementInfo.lines.map((l) => (
                  <tr key={l.id} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-2">{l.label}</td>
                    <td className="px-3 py-2">{l.amount}</td>
                    <td className="px-3 py-2">{l.currency}</td>
                    <td className="px-3 py-2">{l.amountPln}</td>
                    <td className="px-3 py-2">
                      <Button variant="ghost" onClick={() => setExplainId(explainId === l.id ? null : l.id)}>
                        Jak obliczono?
                      </Button>
                      {explainId === l.id ? <div className="mt-2 max-w-md text-xs text-[var(--muted)]">{l.explanation}</div> : null}
                    </td>
                  </tr>
                ))}
              </Table>
            </>
          )}
        </div>
      )}

      {tab === "Dokumenty" && (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={async () => {
              const company = await getCompany();
              downloadPdf(generateTripOrderPdf(company, trip, employee), `${trip.number}-zlecenie.pdf`);
            }}
          >
            PDF zlecenia
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              if (!settlementInfo) return alert("Najpierw policz rozliczenie");
              const company = await getCompany();
              const existing = await getSettlementForTrip(trip.id);
              if (!existing) return;
              downloadPdf(generateSettlementPdf(company, trip, employee, existing), `${trip.number}-rozliczenie.pdf`);
            }}
          >
            PDF rozliczenia
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              const company = await getCompany();
              const rows = trip.segments
                .filter((s) => s.transportMode === "private_car")
                .map((s) => ({
                  date: trip.plannedStartAt.slice(0, 10),
                  route: `${s.fromPlace} → ${s.toPlace}`,
                  km: s.actualDistanceKm ?? s.plannedDistanceKm ?? "0",
                  rate: "1.15",
                  amount: String(Number(s.actualDistanceKm ?? s.plannedDistanceKm ?? 0) * 1.15),
                  plate: vehicle?.plateNumber ?? "—",
                }));
              downloadPdf(generateMileageLogPdf(company, trip, employee, rows), `${trip.number}-ewidencja.pdf`);
            }}
          >
            PDF ewidencji km
          </Button>
        </div>
      )}

      {tab === "Historia" && (
        <Table headers={["Czas", "Akcja", "Szczegóły"]}>
          {auditLog
            .filter((a) => a.entityId === trip.id || a.details.includes(trip.number))
            .map((a) => (
              <tr key={a.id} className="border-t border-[var(--color-border)]">
                <td className="px-3 py-2 text-xs">{a.at.replace("T", " ").slice(0, 19)}</td>
                <td className="px-3 py-2">{a.action}</td>
                <td className="px-3 py-2">{a.details}</td>
              </tr>
            ))}
        </Table>
      )}
    </div>
  );
}
