import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
import { Alert, Button, Field, Input, PageHeader, Select, Textarea } from "../components/ui";
import { RouteMap } from "../components/RouteMap";
import { useAppData } from "../state/AppData";
import { nextTripNumber, saveTrip } from "../data/repository";
import type { BusinessTrip, TransportMode } from "../domain/types";
import { TRANSPORT_LABELS } from "../domain/types";
import { planRouteFromPlaces, type GeoPoint } from "../services/osm";

const STEPS = [
  "Pracownik i cel",
  "Miejsca i daty",
  "Transport",
  "Trasa",
  "Diety i noclegi",
  "Koszty i zaliczka",
  "Podsumowanie",
];

export function TripWizardPage() {
  const { employees, vehicles, refresh, settings } = useAppData();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mapKm, setMapKm] = useState("");
  const [routingBusy, setRoutingBusy] = useState(false);
  const [routePoints, setRoutePoints] = useState<GeoPoint[]>([]);
  const [routeCoords, setRouteCoords] = useState<Array<[number, number]>>([]);
  const [routeMeta, setRouteMeta] = useState<string | null>(null);
  const [form, setForm] = useState({
    employeeId: employees[0]?.id ?? "",
    purpose: "",
    description: "",
    startPlace: "Warszawa",
    destinations: "Łódź",
    plannedStartAt: "",
    plannedEndAt: "",
    isForeign: false,
    countryCode: "PL",
    transportMode: "private_car" as TransportMode,
    vehicleId: vehicles.find((v) => v.kind === "private")?.id ?? "",
    plannedDistanceKm: "",
    actualDistanceKm: "",
    distanceDiffReason: "",
    breakfast: false,
    lunch: false,
    dinner: false,
    dietDisabled: false,
    dietDisabledReason: "",
    hotelPlace: "",
    hotelAmount: "",
    hotelCurrency: "PLN",
    notes: "",
  });

  const useOsm = settings?.mapProvider === "osm";

  const previewNumber = useMemo(() => "…", []);

  async function runOsmRouting() {
    setError(null);
    setRoutingBusy(true);
    try {
      const places = [form.startPlace, ...form.destinations.split(/[,→]/).map((s) => s.trim()).filter(Boolean)];
      const { points, route } = await planRouteFromPlaces(places, settings?.routingServerUrl);
      setRoutePoints(points);
      setRouteCoords(route.coordinates);
      setMapKm(route.distanceKm);
      setForm((f) => ({ ...f, plannedDistanceKm: route.distanceKm }));
      setRouteMeta(`${route.distanceKm} km · ok. ${route.durationMin} min · ${route.attribution}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRoutingBusy(false);
    }
  }

  async function saveDraft(status: BusinessTrip["status"] = "draft") {
    setError(null);
    if (!form.employeeId || !form.purpose || !form.plannedStartAt || !form.plannedEndAt) {
      setError("Uzupełnij pracownika, cel oraz daty.");
      return null;
    }
    if (form.dietDisabled && !form.dietDisabledReason.trim()) {
      setError("Wyłączenie diet wymaga podania przyczyny.");
      return null;
    }
    if (form.actualDistanceKm && form.plannedDistanceKm) {
      const diff = Number(form.actualDistanceKm) - Number(form.plannedDistanceKm);
      if (Math.abs(diff) > 0.05 && !form.distanceDiffReason.trim()) {
        setError("Podaj przyczynę różnicy dystansu mapowego i rzeczywistego.");
        return null;
      }
    }
    const number = await nextTripNumber();
    const dests = form.destinations
      .split("→")
      .join(",")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const trip: BusinessTrip = {
      id: uuid(),
      number,
      issuedAt: new Date().toISOString().slice(0, 10),
      employeeId: form.employeeId,
      purpose: form.purpose,
      description: form.description || null,
      startPlace: form.startPlace,
      plannedStartAt: form.plannedStartAt,
      plannedEndAt: form.plannedEndAt,
      actualStartAt: null,
      actualEndAt: null,
      isForeign: form.isForeign,
      status,
      requesterId: null,
      approverId: null,
      notes: form.notes || null,
      dietDisabled: form.dietDisabled,
      dietDisabledReason: form.dietDisabled ? form.dietDisabledReason : null,
      destinations: dests.map((place, i) => ({
        id: uuid(),
        orderIndex: i,
        place,
        countryCode: form.isForeign ? form.countryCode : "PL",
        isTransit: false,
        plannedArrivalAt: null,
        plannedDepartureAt: null,
      })),
      segments: [
        {
          id: uuid(),
          orderIndex: 0,
          fromPlace: form.startPlace,
          toPlace: dests[0] ?? form.startPlace,
          transportMode: form.transportMode,
          vehicleId: ["private_car", "company_car"].includes(form.transportMode) ? form.vehicleId || null : null,
          plannedDistanceKm: form.plannedDistanceKm || mapKm || null,
          actualDistanceKm: form.actualDistanceKm || null,
          distanceDiffReason: form.distanceDiffReason || null,
          odometerStart: null,
          odometerEnd: null,
        },
      ],
      meals: [
        {
          id: uuid(),
          periodLabel: "Delegacja",
          breakfast: form.breakfast,
          lunch: form.lunch,
          dinner: form.dinner,
          fullBoard: false,
          notes: null,
        },
      ],
      accommodations: form.hotelPlace
        ? [
            {
              id: uuid(),
              place: form.hotelPlace,
              countryCode: form.isForeign ? form.countryCode : "PL",
              checkInAt: form.plannedStartAt,
              checkOutAt: form.plannedEndAt,
              nights: 1,
              amount: form.hotelAmount || "0",
              currency: form.hotelCurrency,
              withinLimit: true,
              overLimitApproved: false,
              overLimitReason: null,
              paidBy: "employee",
              documentRef: null,
              lumpSumWithoutReceipt: false,
              statement: null,
            },
          ]
        : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveTrip(trip, true);
    await refresh();
    return trip;
  }

  return (
    <div>
      <PageHeader title="Nowa delegacja" subtitle={`Kreator · krok ${step + 1}/${STEPS.length}: ${STEPS[step]}`} />
      {error ? <div className="mb-4"><Alert tone="danger">{error}</Alert></div> : null}

      <div className="mb-6 flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(i)}
            className={`rounded-md px-3 py-1 text-xs ${i === step ? "bg-navy-900 text-white" : "bg-[var(--color-surface-muted)] text-[var(--muted)]"}`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--panel)] p-4">
        {step === 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Pracownik">
              <Select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Cel">
              <Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Opis zadania">
                <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Miejsce rozpoczęcia">
              <Input value={form.startPlace} onChange={(e) => setForm({ ...form, startPlace: e.target.value })} />
            </Field>
            <Field label="Destynacje (oddziel przecinkami)">
              <Input value={form.destinations} onChange={(e) => setForm({ ...form, destinations: e.target.value })} />
            </Field>
            <Field label="Początek">
              <Input type="datetime-local" value={form.plannedStartAt} onChange={(e) => setForm({ ...form, plannedStartAt: e.target.value })} />
            </Field>
            <Field label="Koniec">
              <Input type="datetime-local" value={form.plannedEndAt} onChange={(e) => setForm({ ...form, plannedEndAt: e.target.value })} />
            </Field>
            <Field label="Zagraniczna?">
              <Select value={form.isForeign ? "1" : "0"} onChange={(e) => setForm({ ...form, isForeign: e.target.value === "1" })}>
                <option value="0">Krajowa</option>
                <option value="1">Zagraniczna</option>
              </Select>
            </Field>
            {form.isForeign ? (
              <Field label="Kod kraju docelowego">
                <Input value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value.toUpperCase() })} />
              </Field>
            ) : null}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Środek transportu">
              <Select
                value={form.transportMode}
                onChange={(e) => setForm({ ...form, transportMode: e.target.value as TransportMode })}
              >
                {Object.entries(TRANSPORT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            {["private_car", "company_car"].includes(form.transportMode) ? (
              <Field label="Pojazd">
                <Select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                  {vehicles
                    .filter((v) => (form.transportMode === "private_car" ? v.kind === "private" : v.kind === "company"))
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plateNumber} — {v.brand} {v.model}
                      </option>
                    ))}
                </Select>
              </Field>
            ) : null}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <Alert tone="info">
              Mapa OpenStreetMap jest pomocnicza i nie zastępuje rzeczywistego przebiegu. Offline: wprowadź dystans ręcznie.
              {useOsm ? " Aktywny dostawca: darmowy OSM (Photon + OSRM)." : " Tryb ręczny — włącz OSM w Ustawieniach."}
            </Alert>
            {useOsm && (routeCoords.length > 0 || routePoints.length > 0) ? (
              <RouteMap points={routePoints} coordinates={routeCoords} />
            ) : null}
            {routeMeta ? <p className="text-sm text-[var(--muted)]">{routeMeta}</p> : null}
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Dystans wg mapy / planu (km)">
                <Input value={form.plannedDistanceKm || mapKm} onChange={(e) => { setMapKm(e.target.value); setForm({ ...form, plannedDistanceKm: e.target.value }); }} />
              </Field>
              <Field label="Dystans rzeczywisty (km)">
                <Input value={form.actualDistanceKm} onChange={(e) => setForm({ ...form, actualDistanceKm: e.target.value })} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Przyczyna różnicy">
                  <Input value={form.distanceDiffReason} onChange={(e) => setForm({ ...form, distanceDiffReason: e.target.value })} />
                </Field>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                type="button"
                disabled={!useOsm || routingBusy}
                onClick={() => void runOsmRouting()}
              >
                {routingBusy ? "Wyznaczanie trasy OSM…" : "Wyznacz trasę (OpenStreetMap)"}
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setMapKm(form.plannedDistanceKm || "0");
                  setRouteMeta("Tryb ręczny — dystans bez routingu zewnętrznego.");
                }}
              >
                Tylko ręcznie
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.breakfast} onChange={(e) => setForm({ ...form, breakfast: e.target.checked })} /> Śniadanie zapewnione</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.lunch} onChange={(e) => setForm({ ...form, lunch: e.target.checked })} /> Obiad zapewniony</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.dinner} onChange={(e) => setForm({ ...form, dinner: e.target.checked })} /> Kolacja zapewniona</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.dietDisabled} onChange={(e) => setForm({ ...form, dietDisabled: e.target.checked })} /> Bez diet</label>
            {form.dietDisabled ? (
              <div className="md:col-span-2">
                <Alert tone="warn">Opcja „bez diet” nie oznacza automatycznie zgodności z prawem — wymagana przyczyna.</Alert>
                <Field label="Przyczyna wyłączenia diet">
                  <Input value={form.dietDisabledReason} onChange={(e) => setForm({ ...form, dietDisabledReason: e.target.value })} />
                </Field>
              </div>
            ) : null}
            <Field label="Nocleg — miejscowość">
              <Input value={form.hotelPlace} onChange={(e) => setForm({ ...form, hotelPlace: e.target.value })} />
            </Field>
            <Field label="Kwota noclegu">
              <Input value={form.hotelAmount} onChange={(e) => setForm({ ...form, hotelAmount: e.target.value })} />
            </Field>
          </div>
        )}

        {step === 5 && (
          <Alert tone="info">Planowane koszty i zaliczkę możesz dodać po utworzeniu zlecenia w szczegółach delegacji (Koszty / Zaliczki).</Alert>
        )}

        {step === 6 && (
          <div className="space-y-2 text-sm">
            <div>Numer: nadany przy zapisie ({previewNumber})</div>
            <div>Pracownik: {employees.find((e) => e.id === form.employeeId)?.firstName} {employees.find((e) => e.id === form.employeeId)?.lastName}</div>
            <div>Cel: {form.purpose || "—"}</div>
            <div>Trasa: {form.startPlace} → {form.destinations}</div>
            <div>Transport: {TRANSPORT_LABELS[form.transportMode]}</div>
            <Field label="Uwagi / warunki">
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Wstecz</Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)}>Dalej</Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={async () => {
                  const trip = await saveDraft("draft");
                  if (trip) navigate(`/delegacje/${trip.id}`);
                }}
              >
                Zapisz wersję roboczą
              </Button>
              <Button
                onClick={async () => {
                  const trip = await saveDraft("pending_approval");
                  if (trip) navigate(`/delegacje/${trip.id}`);
                }}
              >
                Przekaż do zatwierdzenia
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
