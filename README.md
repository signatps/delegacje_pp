# Delegacje PP

Aplikacja desktopowa (Tauri 2 + React + TypeScript + SQLite) do tworzenia, obsługi i rozliczania podróży służbowych — branding i dane pracodawcy: **PRO-PLUS S.A.** (ul. Śnieżna 3, 03-750 Warszawa, NIP 5213282953). Mapy/trasy: darmowe **OpenStreetMap** (Photon + OSRM).

**Repozytorium:** [github.com/signatps/delegacje_pp](https://github.com/signatps/delegacje_pp)  
**Project board:** [Delegacje PP](https://github.com/users/signatps/projects/18)  
**Issues:** [lista zgłoszeń](https://github.com/signatps/delegacje_pp/issues)  
**CI:** [GitHub Actions](https://github.com/signatps/delegacje_pp/actions)

## Stack

- **Tauri 2** — powłoka desktopowa (Windows 10/11, macOS)
- **React + TypeScript + Tailwind CSS** — UI (język domyślny: polski)
- **SQLite (sql.js)** — lokalna baza z migracją schematu i kopią zapasową
- **Rust** — komendy natywne + testy obliczeń diet (`rust_decimal`)
- **decimal.js** — precyzyjne obliczenia finansowe (bez `float`)
- **NBP API** — kursy walut (z fallbackiem ręcznym)
- **jsPDF** — dokumenty PDF

## Uruchomienie (tryb web / podgląd UI)

Wymaga Node.js 22+.

```bash
npm ci
npm run dev
```

Aplikacja startuje na [http://127.0.0.1:14347](http://127.0.0.1:14347). Dane są zapisywane lokalnie w przeglądarce (SQLite → `localStorage`).

```bash
npm test          # testy jednostkowe diet / km
npm run build     # produkcyjny build frontendu
```

## Uruchomienie desktop (Tauri)

Wymagania: [prerequisites Tauri](https://tauri.app/start/prerequisites/) (Rust, na Linuxie m.in. webkit2gtk).

```bash
npm ci
npm run tauri:dev
npm run tauri:build
```

### Minimalne wersje systemów

- Windows: **10/11 64-bit** (konfigurowalne w Ustawieniach)
- macOS: domyślnie **14+** (Sonoma), **tylko Apple Silicon (arm64)** w CI. Wartość minimum jest **łatwa do zmiany** w Ustawieniach i w `tauri.conf.json`. Specyfikacja wskazywała „macOS 27+” — zweryfikuj przed dystrybucją.
- Linux i macOS Intel: **wyłączone w CI** (oszczędność minut Actions); można przywrócić później.

### macOS: komunikat „aplikacja jest uszkodzona”

Buildy CI są **niepodpisane Developer ID** (tylko ad-hoc). Safari/Gatekeeper oznacza pobrany plik kwarantanną i pokazuje ten komunikat mimo że plik jest OK.

Po pobraniu artefaktu (`.app` / ZIP):

```bash
# usuń kwarantannę Gatekeeper (najczęstsza przyczyna)
xattr -cr "/sciezka/do/Delegacje PP.app"

# ewentualnie jawna zgoda w terminalu
open "/sciezka/do/Delegacje PP.app"
```

Albo: **Ustawienia systemowe → Prywatność i ochrona → „Otwórz mimo to”** po pierwszej próbie uruchomienia.

Produkcja wymaga Apple Developer ID + notaryzacji (sekrety CI) — issue #18.

## Co jest zaimplementowane (v0.1)

- Panel główny ze statusami, skrótami i demo A/B/C
- Pracownicy (CRUD, dezaktywacja, duplikaty, CSV)
- Pojazdy prywatne/służbowe z kategoriami pojemności i flagą weryfikacji
- Kreator zlecenia (7 kroków), statusy obiegu, szczegóły z zakładkami
- Diety krajowe i zagraniczne z wyjaśnieniem „Jak obliczono?”
- Kilometrówka (bez auto-km dla służbowych)
- Koszty, zaliczki (niewypłacona ≠ przekazana), rozliczenie z terminem 14 dni
- Kursy NBP + kurs ręczny z uzasadnieniem
- PDF: zlecenie, rozliczenie, ewidencja km
- Kopia / odtworzenie / reset bazy SQLite
- GitHub Actions: testy + build Tauri (**Windows**, **macOS Apple Silicon**); Linux/Intel wyłączone

## Ograniczenia i decyzje księgowe

- Stawki seed (dieta 45 zł, km 0,89 / 1,15 zł) pochodzą ze specyfikacji bazowej — **wymagają weryfikacji** względem aktualnych przepisów.
- Routing mapowy w v0.1 działa w trybie ręcznym; zewnętrzny dostawca wymaga klucza / własnego serwera (Ustawienia).
- OCR, szyfrowanie bazy hasłem, synchronizacja wielostanowiskowa — przygotowane architektonicznie / opisane, nie jako działające „udawane” funkcje.
- Praca **jednostanowiskowa**; nie używaj SQLite na udziale sieciowym dla wielu użytkowników.

## Struktura

```
src/                 UI + domena TS + sql.js
src/domain/          diety, km, settlement, money
src/data/            schemat SQLite, seed, repository
src-tauri/           Tauri + testy Rust diet
.github/workflows/   CI / build instalatorów
```

## Licencja

Projekt prywatny / do uzgodnienia z właścicielem.
