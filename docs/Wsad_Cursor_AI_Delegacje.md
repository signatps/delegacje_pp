# Wsad do Cursor AI — aplikacja do delegacji służbowych

## 1. Cel projektu

Zaprojektuj i zaimplementuj kompletną, nowoczesną aplikację desktopową do tworzenia, obsługi i rozliczania podróży służbowych pracowników w Polsce i za granicą.

Aplikacja ma działać na Windows 10/11 64-bit i macOS 27 lub nowszym, na Apple Silicon oraz Intel, jeżeli docelowa wersja systemu i wybrany stos technologiczny obsługują daną architekturę. Przed wyborem minimalnych wersji systemów i sposobu dystrybucji zweryfikuj faktyczną dostępność i wymagania docelowej wersji macOS. Nie zakładaj, że każda wersja obsługuje zarówno Intel, jak i Apple Silicon. Umożliw łatwą zmianę minimalnej wersji systemu.

Aplikacja ma być przeznaczona dla polskich pracodawców, w szczególności małych i średnich firm. Ma obsługiwać cały proces: utworzenie i zatwierdzenie zlecenia wyjazdu, przyznanie i wypłatę zaliczki, rejestrację rzeczywistego przebiegu podróży, dodanie rachunków i kosztów, automatyczne wyliczenie należności, zatwierdzenie rozliczenia oraz generowanie dokumentów i zestawień. Domyślny język interfejsu: polski; architektura ma umożliwiać dodanie innych języków.

## 2. Sposób pracy nad projektem

Najpierw przeanalizuj istniejące repozytorium, dostępne technologie i zależności, zaproponuj architekturę oraz plan implementacji, a następnie zaimplementuj działającą aplikację. Jeśli repozytorium jest puste, utwórz projekt od podstaw.

Nie kończ pracy na makietach, przykładowych ekranach ani danych testowych. Zaimplementuj rzeczywisty zapis i odczyt danych, obliczenia, generowanie dokumentów, załączniki, kursy walut, wyznaczanie tras i aktualizację stawek albo mechanizm kontrolowanego importu. Gdy automatyzacja wymaga usługi zewnętrznej lub klucza API, zaimplementuj pełny interfejs integracyjny oraz działający wariant ręczny. Nie udawaj działania nieskonfigurowanej integracji.

## 3. Proponowana technologia

- Tauri 2 — aplikacja desktopowa.
- React + TypeScript — interfejs.
- Rust — logika systemowa i dostęp do zasobów lokalnych.
- SQLite — lokalna baza danych i migracje.
- Tailwind CSS oraz dopracowany zestaw komponentów.
- Biblioteka do precyzyjnych obliczeń dziesiętnych i generowanie PDF.

Jeśli inne rozwiązanie jest istotnie lepsze dla obu platform, zaproponuj je z uzasadnieniem. Ważne są: niewielki rozmiar, szybkie uruchamianie, praca bez stałego internetu, łatwa rozbudowa, dobre drukowanie, PDF i załączniki. Nie używaj `float` do przechowywania kwot ani końcowych obliczeń finansowych; użyj liczb dziesiętnych o kontrolowanej precyzji lub najmniejszych jednostek walutowych.

## 4. Główne moduły

Panel główny, pracownicy, pojazdy prywatne i służbowe, zlecenia, delegacje krajowe i zagraniczne, trasy i przebieg pojazdu, diety i ryczałty, koszty i załączniki, zaliczki, rozliczenia i płatności, stawki i kursy, dokumenty i raporty, ustawienia firmy, kopie zapasowe oraz historia operacji.

## 5. Panel główny

Pokaż delegacje w przygotowaniu, oczekujące na zatwierdzenie, zaplanowane, trwające, oczekujące na rozliczenie i po terminie; rozliczenia oczekujące na zatwierdzenie; kwoty do wypłaty, nierozliczone zaliczki, ostatnie dokumenty i koszty, aktualizacje stawek oraz dostępność internetu i usług. Zapewnij szybkie przyciski: Nowa delegacja, Nowy pracownik, Dodaj koszt, Rozlicz delegację, Aktualizuj stawki, Wygeneruj raport. Wyświetlaj tylko dane dostępne użytkownikowi.

## 6. Baza pracowników

Karta pracownika: imię i nazwisko, numer ewidencyjny, stanowisko, dział, e-mail, opcjonalnie telefon, miejsce pracy, miejscowość stałego lub czasowego pobytu, jeżeli jest potrzebna do ustalenia uprawnień, opcjonalnie numer rachunku, przełożony, status, uwagi, przypisane pojazdy prywatne oraz historia delegacji, zaliczek i rozliczeń. Nie wymagaj PESEL ani innych zbędnych danych.

Umożliw dodawanie, edycję, dezaktywację bez utraty historii, wyszukiwanie, filtrowanie, import CSV/XLSX, eksport zgodnie z uprawnieniami oraz wykrywanie potencjalnych duplikatów.

## 7. Baza pojazdów

### 7.1. Pojazdy prywatne

Przechowuj właściciela lub uprawnionego użytkownika, markę, model, numer rejestracyjny, rodzaj pojazdu i napędu (benzyna, diesel, LPG, hybrydowy, elektryczny, inny), pojemność skokową w cm³, jeśli dotyczy, okres przypisania, zgodę pracodawcy, ewentualną indywidualną stawkę, status i uwagi. Wspieraj kategorie samochodów osobowych: do 900 cm³ włącznie oraz powyżej 900 cm³.

Dla elektrycznych i innych pojazdów bez pojemności silnika spalinowego nie przypisuj automatycznie kategorii pojemności; umożliw ustalenie stawki według zasad pracodawcy, wymagaj podstawy decyzji i oznacz potrzebę weryfikacji przez księgowość. Dla hybryd zapisz pojemność silnika spalinowego i kategorię, z możliwością weryfikacji zasad.

### 7.2. Pojazdy służbowe

Przechowuj markę, model, numer rejestracyjny, napęd, formę użytkowania (własność, leasing, wynajem), domyślnego użytkownika, status i uwagi. Nie naliczaj automatycznie kilometrówki dla samochodu służbowego. Umożliw rozliczenie uprawnionych wydatków, np. paliwa, ładowania, parkingów i autostrad, z uwzględnieniem tego, kto poniósł koszt.

## 8. Tworzenie zlecenia wyjazdu

Przygotuj kreator: (1) pracownik i cel, (2) miejsca i daty, (3) środki transportu, (4) trasa, (5) diety, noclegi i wyżywienie, (6) planowane koszty i zaliczka, (7) podsumowanie i zlecenie. Na każdym etapie umożliw zapis wersji roboczej.

Zlecenie zawiera: automatyczny numer z możliwością zmiany zgodnie z uprawnieniami, datę wystawienia, pracownika i stanowisko, cel i opis zadania, miejsce rozpoczęcia, jedno lub wiele miejsc docelowych, punkty pośrednie, kraje, planowane daty i godziny, środek transportu, noclegi, wyżywienie, przewidywane koszty, zaliczkę, zlecającego, zatwierdzającego, uwagi i warunki dodatkowe.

Obsłuż samochód prywatny, służbowy i wynajęty, kolej, samolot, autobus, prom, transport publiczny, taksówkę i inny środek transportu. Jedna delegacja może obejmować wiele odcinków różnymi środkami, np. Warszawa → lotnisko samochodem służbowym → lot do Sofii → samochód wynajęty → kilka miejscowości → lot powrotny.

Statusy: wersja robocza; przekazana do zatwierdzenia; zatwierdzona; odrzucona; zaplanowana; w trakcie; zakończona i oczekująca na rozliczenie; rozliczenie w przygotowaniu; przekazane do weryfikacji; zaakceptowane; zwrócone do poprawy; rozliczona; anulowana. Umożliw uproszczenie obiegu w ustawieniach.

## 9. Trasy i przebieg pojazdu

### 9.1. Wyznaczanie trasy

Po podaniu punktu startowego, docelowego i pośrednich znajdź adresy lub miejscowości, zaproponuj trasę drogową, pokaż ją na mapie, odległość i szacowany czas oraz umożliw wybór alternatywy. Umożliw wiele punktów pośrednich i zmianę ich kolejności, np. Warszawa → Łódź → Poznań → Szczecin → Warszawa. Powrót może przebiegać inną trasą.

### 9.2. Trasa rzeczywista

Pracownik może zaakceptować proponowaną trasę, zmienić punkty, dodać przejazdy lokalne, ręcznie wpisać rzeczywisty dystans i przyczynę różnicy oraz opcjonalnie podać stan licznika. Pokaż dystans według mapy i rzeczywisty, różnicę w km i procentach oraz uzasadnienie. Mapa jest pomocnicza i nie może zastępować rzeczywistego przebiegu ani blokować ręcznego rozliczenia.

### 9.3. Dostawcy

Zaprojektuj wymienną integrację geokodowania, routingu i map, w tym możliwość użycia rozwiązań opartych na OpenStreetMap i innych dostawców, jeśli warunki na to pozwalają. Ustawienia: wybór dostawcy, klucz API, własny serwer routingu, test połączenia, informacja o limitach i kosztach. Sprawdź warunki publicznych serwerów; nie zakładaj nieograniczonego komercyjnego użytku. Offline zapewnij ręczne wprowadzenie trasy i dystansu.

### 9.4. Ewidencja przebiegu

Dla samochodu prywatnego generuj ewidencję: pracownik, pojazd i numer rejestracyjny, data, cel, opis trasy, liczba km, stawka, zwrot i numer delegacji; umożliw podział na odcinki. Zwrot = zaakceptowane km × stawka dla delegacji. Stawki ustawowe traktuj zgodnie z ich rolą i przepisami. Umożliw stawkę przyjętą przez pracodawcę, sygnalizuj przekroczenie właściwych limitów i potrzebę weryfikacji podatkowej.

## 10. Diety krajowe

Naliczaj według obowiązujących przepisów z uwzględnieniem dat obowiązywania. Początkowe reguły:

- Podróż nie dłuższa niż doba: mniej niż 8 godzin — brak diety; od 8 do 12 godzin — 50%; ponad 12 godzin — 100%.
- Podróż dłuższa niż doba: za każdą pełną dobę 100%; za rozpoczętą niepełną dobę do 8 godzin 50%, ponad 8 godzin 100%.

Uwzględnij dokładne granice, np. 8:00, 12:00, 24:00 i 32:00. Odlicz zapewnione bezpłatnie posiłki: śniadanie 25% pełnej diety, obiad 50%, kolacja 25%. Uwzględnij posiłki faktycznie zapewnione w hotelu lub na konferencji. Nie dopuszczaj diety ujemnej. Pozwól oznaczyć posiłki w poszczególnych okresach i pokaż ich związek z obliczeniem.

Umożliw wyłączenie lub korektę diety z przyczyną, np. pełne bezpłatne wyżywienie, pobyt w miejscowości stałego lub czasowego pobytu, gdy przewidują to przepisy, albo inna opisana podstawa. Opcja „bez diet” nie oznacza automatycznie zgodności z prawem; wymagaj przyczyny i ostrzegaj o możliwym naruszeniu minimalnych uprawnień.

## 11. Diety zagraniczne

Tabela zawiera państwo, walutę i kwotę diety za dobę, limit noclegu, daty obowiązywania, źródło i rozróżnienie stawki przepisowej oraz firmowej. Zapewnij jej aktualizację.

Użytkownik podaje początek i koniec całej delegacji oraz części zagranicznej, przekroczenia granicy albo zdarzenia właściwe dla transportu, kraje docelowe oraz daty i godziny pobytu. Uwzględnij zasady transportu lądowego, lotniczego i morskiego; w lotach możliwość wskazania startu z ostatniego lotniska w Polsce i lądowania na pierwszym lotnisku w Polsce przy powrocie, zgodnie z przepisami. Zapisuj chwilę zdarzenia, lokalną datę i godzinę oraz strefę czasową; uwzględnij zmianę czasu.

Obliczaj: każda pełna doba 100%, niepełna do 8 godzin 1/3, ponad 8 do 12 godzin 50%, ponad 12 godzin 100%. Uwzględnij śniadanie 15%, obiad 30%, kolację 30%, pełne bezpłatne wyżywienie oraz przypadki należności pieniężnej na wyżywienie i pobytu w szpitalu zgodnie z przepisami.

Umożliw wiele krajów docelowych; kraj tranzytowy nie staje się automatycznie docelowym. Decyzję o wielu krajach i przyporządkowaniu stawek dokumentuj i zatwierdzaj; pokaż założenia i umożliw korektę w niejednoznacznych sytuacjach.

Umożliw oddzielną analizę krajowej części zagranicznego wyjazdu, np. dojazdu do lotniska. Nie zakładaj bezwarunkowo jednej metody w każdej sytuacji; pokaż sposób obliczenia i pozwól skonfigurować metodę zweryfikowaną przez pracodawcę.

## 12. Ryczałty i noclegi

Dla noclegu zapisz miejscowość i kraj, okres, liczbę noclegów, cenę i walutę, koszt poszczególnych dób, posiłki, dokument, sposób zapłaty, ponoszącego koszt i zgodę na przekroczenie limitu. Ustal właściwy limit, pokaż przekroczenie i zgodę na jego przekroczenie tam, gdzie to dopuszczalne. Rozlicz tylko część dotyczącą pracownika, jeśli rachunek obejmuje kilka osób.

Ryczałt za nocleg bez rachunku naliczaj po sprawdzeniu warunków, a nie automatycznie. Pozwól zapisać miejsce, czas, okoliczności, informację o zapewnieniu noclegu i oświadczenie pracownika.

Uwzględnij faktyczne koszty komunikacji, należne ryczałty, taksówki i przejazdy lokalne oraz dojazd do dworca, portu lub lotniska, jeśli zasady na to pozwalają. Uwzględnij warunki i wyłączenia, w tym środek transportu i zapewnione przejazdy; nie naliczaj ryczałtów wszystkim automatycznie.

## 13. Koszty i rachunki

Kategorie konfigurowalne obejmują co najmniej hotel, wyżywienie, bilety kolejowe, lotnicze i autobusowe, transport publiczny, taksówkę, wynajem, paliwo, ładowanie, parking, autostrady, winiety, prom, konferencję, bagaż i inne.

Dane kosztu: data, kategoria, opis, kwota i waluta (co najmniej PLN, EUR, USD, GBP i inne), kraj, opcjonalnie sprzedawca i numer dokumentu/faktury, brutto, opcjonalnie VAT, delegacja, sposób płatności, ponoszący koszt (pracownik, firma, karta służbowa, zaliczka, inna osoba), kwota do zwrotu, akceptacja i komentarz. Nie doliczaj automatycznie kosztu poniesionego przez firmę do zwrotu pracownikowi.

Załączniki: PDF, JPG/JPEG, PNG i inne popularne obrazy obsługiwane na obu platformach. Zapewnij wybór pliku, przeciąganie, podgląd, obrót i powiększenie, wiele plików do kosztu, jeden dokument powiązany z wieloma kosztami, kontrolę możliwych duplikatów i eksport wraz z rozliczeniem. Przechowuj je w sposób zapewniający pełną kopię; przy plikach poza bazą użyj kontrolowanego repozytorium, identyfikatorów i sum kontrolnych. Kopia obejmuje bazę i pliki.

Wydatek na jedzenie nie może automatycznie zwiększać zwrotu, pomniejszać diety ani oznaczać zapewnienia posiłku. Użytkownik określa charakter wydatku i faktyczne zapewnienie posiłku. Ostrzegaj o możliwym podwójnym rozliczeniu prywatnego posiłku pokrywanego dietą; dopuszczaj odrębne rozliczenie zgodnie z zatwierdzonymi zasadami lub decyzją i opisem.

Pozwól dodać koszt bez rachunku z obowiązkowym oświadczeniem: rodzaj, data, kwota, okoliczności i przyczyna braku dokumentu. Generuj oświadczenie do podpisania lub zatwierdzenia.

Przygotuj architekturę pod OCR. Jeśli wdrożysz OCR, proponuj datę, kwotę, walutę, numer i sprzedawcę, ale każda wartość wymaga potwierdzenia. Nie wysyłaj dokumentu do zewnętrznego OCR bez konfiguracji i informacji o przekazaniu danych.

## 14. Zaliczki

Obsłuż wniosek, kwotę i walutę, zatwierdzenie, faktyczną wypłatę i jej datę, wiele zaliczek do delegacji, rozliczenia częściowe i końcowe, zwrot niewykorzystanej kwoty, dopłatę i potwierdzenia. Statusy: wnioskowana, zatwierdzona, wypłacona, częściowo rozliczona, rozliczona, anulowana. Uwzględnij przepisy o zaliczkach krajowych i zagranicznych oraz możliwość wypłaty w PLN za zgodą pracownika tam, gdzie przewidują to przepisy. Niewypłaconej zaliczki nie traktuj jako przekazanej.

## 15. Waluty i kursy NBP

Zintegruj oficjalne API HTTPS `https://api.nbp.pl/api/`: kursy aktualne i historyczne, waluty dostępne w odpowiednich tabelach, lokalna pamięć kursów, numer tabeli, data publikacji, rodzaj kursu i źródło. Zapewnij offline, informację o braku kursu dla daty, wyszukanie właściwego dostępnego kursu zgodnie z wybraną metodą, ręczne wprowadzenie kursu z uzasadnieniem i źródłem.

Nie stosuj jednej sztywnej zasady do wszystkich wydatków. Rozdziel rozliczenie z pracownikiem, przeliczenie zaliczek, księgowe i podatkowe. Dla każdego umożliw konfigurację zweryfikowanej metody, pokazując kwotę źródłową, walutę, kurs, datę i numer tabeli, wynik oraz podstawę. Jeśli nie da się jednoznacznie ustalić kursu, skieruj do decyzji księgowości; nie podstawiaj po cichu aktualnego kursu. Zachowuj oryginalne kwoty, np. hotel 300 EUR, parking 25 EUR, kolej 150 PLN, inny wydatek 80 USD.

## 16. Automatyczna aktualizacja diet i kilometrówki

Aktualizuj dietę krajową, zagraniczne stawki i waluty, limity noclegów, maksymalne stawki km i pozostałe parametry. Nie zapisuj ich wyłącznie na stałe w kodzie. Źródła: oficjalne akty prawa, Dziennik Ustaw/ELI i właściwe strony rządowe. Sprawdź faktyczną dostępność i formaty; nie zakładaj istnienia kompletnego stabilnego API.

Proces: wykryj nowy akt/dane, pobierz informację i źródło, porównaj, pokaż różnice oraz datę wejścia w życie, sprawdź kompletność, wymagaj zatwierdzenia, zapisz nową wersję i zachowaj poprzednie. Jeśli niezawodny automatyczny odczyt tabel nie jest możliwy, wykrywaj zmianę i obsłuż kontrolowany import albo ręczne wprowadzanie i zatwierdzanie. Nie przedstawiaj niezweryfikowanych danych jako obowiązujących.

Dla rozliczenia zapisz stawkę, wersję zestawu, okres obowiązywania, źródło, datę pobrania i zatwierdzenia, zatwierdzającego i zasadę wyboru. Zatwierdzone rozliczenia nie zmieniają się same po aktualizacji; korekty zapisuj osobno z historią. Dla podróży na przełomie zmian stosuj przepisy przejściowe lub wymagaj weryfikacji; nie zakładaj zawsze proporcjonalnego podziału.

## 17. Rozliczenie delegacji

Po powrocie wprowadź rzeczywisty początek i koniec, trasy, transport, przekroczenia granic lub inne właściwe zdarzenia, punkty docelowe, noclegi, posiłki, koszty, zaliczki i odstępstwa od zlecenia.

Podsumowanie pokazuje diety krajowe i zagraniczne, kilometrówkę, bilety i przejazdy, noclegi, parkingi i opłaty drogowe, pozostałe zaakceptowane koszty, należność przed zaliczką, wypłacone zaliczki oraz kwotę do wypłaty albo zwrotu. Oddzielnie pokaż koszty poniesione bezpośrednio przez firmę. Przy wielu walutach pokaż wartości źródłowe, wynik w walucie rozliczenia, kurs i podstawę.

Przy każdej pozycji przycisk „Jak obliczono?” pokazuje dane, regułę, okres, stawkę, pomniejszenia, wyniki pośrednie i końcowy, źródło oraz wersję zasad.

Korekta przez uprawnioną osobę wymaga powodu, wartości przed i po, osoby, daty i podstawy/komentarza; nie nadpisuj oryginalnego wyniku. Pokaż termin rozliczenia wynikający z przepisów, w tym standardowe 14 dni od zakończenia tam, gdzie ma zastosowanie, i przypomnienia o terminie.

## 18. Dokumenty i wydruki

Generuj PDF: polecenie wyjazdu, zlecenie zagraniczne, wniosek i potwierdzenie wypłaty zaliczki, rozliczenie, ewidencję pojazdu, zestawienie kosztów, oświadczenie o braku dokumentu, oświadczenie o posiłkach i noclegach oraz zestawienie należności pracowników.

Zapewnij dane firmy, logo, numer dokumentu, czytelne tabele, podsumowania i waluty, stawki, miejsca podpisów, format A4 i polskie znaki. Szablony dostosowywalne. Podgląd, PDF, druk, pakiet rozliczenie + ewidencja + załączniki oraz eksport CSV/XLSX. Zwykłe kliknięcie zatwierdzenia to akceptacja w systemie, nie kwalifikowany podpis elektroniczny.

## 19. Raporty

Filtry: okres, pracownik, dział, cel, kraj, pojazd, transport, status, kategoria. Raporty: liczba i koszty delegacji, według pracowników, działów, kategorii i walut, diety, kilometrówka, km według pojazdów i pracowników, zaliczki nierozliczone, delegacje po terminie, kwoty oczekujące na wypłatę. Rozróżniaj pełen koszt delegacji, koszty zapłacone przez firmę, należność pracownika i rozliczone zaliczki.

## 20. Użytkownicy i uprawnienia

- Administrator: konfiguracja, użytkownicy i pracownicy, stawki, kopie, wszystkie dane.
- Zlecający/przełożony: tworzenie i zatwierdzanie w zakresie uprawnień, rozliczenia podległych pracowników.
- Pracownik: własne delegacje, koszty i załączniki, przebieg, przekazanie rozliczenia.
- Księgowość: weryfikacja kosztów i kursów, rozliczenia, zaliczki i wypłaty, eksport i raporty.

SQLite na jednym komputerze nie zapewnia współdzielenia ani centralnych uprawnień. W pierwszym etapie zapewnij pracę jednostanowiskową, jasno opisz ochronę lokalnego logowania i nie stosuj domyślnie SQLite na udziale sieciowym do wielu użytkowników. Przygotuj możliwość późniejszego dodania serwera, kont, synchronizacji, pracy wielostanowiskowej i centralnej autoryzacji. Nie sugeruj działania synchronizacji, której nie wdrożono.

## 21. Bezpieczeństwo i ochrona danych

Minimalizuj dane; ogranicz dostęp; przechowuj klucze i loginy w mechanizmach systemowych; umożliw szyfrowanie danych i kopii z opisem zakresu i odzyskiwania. Nie umieszczaj haseł ani API keys w repozytorium. Aktualizuj zależności, loguj operacje administracyjne, zapobiegaj przypadkowemu usuwaniu, waliduj pliki i ograniczaj rozmiar, bezpiecznie otwieraj załączniki, umożliw anonimizację danych testowych. Informuj o przekazywaniu adresów i trasy dostawcy map.

Log obejmuje utworzenie i modyfikację, zatwierdzenie i odrzucenie, zmianę stawek, korektę obliczeń, dodanie i usunięcie kosztu, wypłatę zaliczki oraz zatwierdzenie rozliczenia.

## 22. Kopie zapasowe

Ręczna kopia, przypomnienie, opcjonalna kopia przy zamykaniu, odtwarzanie, kontrola integralności, data ostatniej poprawnej kopii, wybór lokalizacji i zabezpieczenie hasłem lub innym mechanizmem. Kopia obejmuje bazę, załączniki, niezbędne ustawienia, wersję schematu i dane do migracji. Przed odtworzeniem pokaż zakres zastępowania i zaproponuj kopię aktualnego stanu. Nie zapisuj haseł i kluczy API jawnie.

## 23. Interfejs użytkownika

Nowoczesny, lekki, profesjonalny: białe i jasnoszare tła, granat lub ciemny niebieski jako kolor podstawowy, turkus/niebieski akcent, delikatne obramowania, umiarkowane zaokrąglenia, czytelna typografia, proste ikony i przestrzeń. Tryb jasny/ciemny, skalowanie, klawiatura, responsywne okno i zrozumiałe błędy.

Nawigacja po lewej: Pulpit, Delegacje, Pracownicy, Pojazdy, Koszty, Zaliczki, Raporty, Stawki i kursy, Ustawienia. U góry: wyszukiwarka, szybkie dodawanie, powiadomienia i użytkownik/profil.

Szczegóły delegacji: Podstawowe informacje; Trasa i transport; Diety i posiłki; Noclegi; Koszty i załączniki; Zaliczki; Rozliczenie; Dokumenty; Historia. Pokaż etap, braki, szacowaną należność, ostrzeżenia i zatwierdzających.

## 24. Zasady firmy

Panel obejmuje dane pracodawcy, numerację, domyślnych zatwierdzających, zasady krajowe i zagraniczne, stawki pracodawcy, metody walutowe, akceptację i kategorie kosztów, załączniki, pojazdy prywatne, limity wewnętrzne i szablony. Oddziel wartości przepisowe, wewnętrzne i indywidualnie zatwierdzone. Ostrzegaj o możliwym naruszeniu uprawnień lub przekroczeniu limitów podatkowych, ale nie blokuj automatycznie dopuszczalnych przekroczeń; oznaczaj je i wymagaj decyzji.

## 25. Model danych

Uwzględnij co najmniej `Company`, `User`, `Role`, `Employee`, `Vehicle`, `VehicleAssignment`, `BusinessTrip`, `TripDestination`, `TripSegment`, `BorderOrTravelEvent`, `RoutePoint`, `MileageEntry`, `MealProvision`, `Accommodation`, `Expense`, `ExpenseAllocation`, `Attachment`, `Advance`, `Settlement`, `SettlementLine`, `Payment`, `CountryRate`, `MileageRate`, `ExchangeRate`, `RateSetVersion`, `Policy`, `Approval`, `AuditLog`.

Każdy rekord finansowy powinien pozwalać odtworzyć dane wejściowe, stawkę, przeliczenie, walutę, wynik, źródło, wersję zasad i zatwierdzenia. Oddziel dane planowane od rzeczywistych.

## 26. Praca offline

Offline działają przegląd i tworzenie delegacji, ręczne trasy, koszty, załączniki, dokumenty i obliczenia z użyciem dostępnych zatwierdzonych danych. Internet służy pobraniu kursów, aktualizacji stawek, geokodowaniu/routingowi i aktualizacji aplikacji. Brak wymaganej stawki lub kursu zgłaszaj wprost, pozwalając zapisać niekompletną delegację.

## 27. Testy i przypadki brzegowe

Przygotuj testy jednostkowe i integracyjne:

- Krajowe: 7:59, dokładnie 8:00, 12:00, 12:01, 24:00, 24:01, 32:00, 32:01; częściowe i pełne posiłki, hotel ze śniadaniem, wyłączenie diety z podstawą.
- Zagraniczne: dokładnie 8:00, 8:01, 12:00, 12:01, wiele dób, pełne wyżywienie, wiele krajów docelowych i kraj tranzytowy, lot, strefy czasowe i zmiana czasu.
- Kilometrówka: 900 i 901 cm³, elektryk bez pojemności, hybryda, ręczna zmiana dystansu, wiele punktów, samochód służbowy bez automatycznej kilometrówki.
- Koszty i waluty: PLN/EUR/USD, brak kursu danego dnia, tabela B, wydatek pracownika i firmy, zaliczka zatwierdzona ale niewypłacona, zaliczka wyższa niż należność, hotel ponad limit, rachunek za posiłek i dieta, dokument kilku osób, brak rachunku i oświadczenie.
- Historia: aktualizacja stawki po zatwierdzeniu, korekta rozliczenia, odtworzenie kopii z załącznikami, odtworzenie obliczenia według zapisanej wersji zasad.

Testy finansowe sprawdzają wartości i warunki brzegowe, nie tylko wyświetlanie ekranów.

## 28. Scenariusze demonstracyjne

Opcjonalne, jednoznacznie oznaczone i usuwalne dane:

- A: Warszawa → Łódź → Poznań → Warszawa, samochód prywatny powyżej 900 cm³, nocleg, parking, śniadanie hotelowe, rzeczywista trasa dłuższa, zaliczka PLN.
- B: Warszawa → Sofia → Sandanski → Sofia → Warszawa, samolot, samochód wynajęty, hotel EUR, parking w walucie lokalnej, częściowe wyżywienie, zaliczka i rachunki PDF/zdjęcia.
- C: Warszawa → Kraków → Warszawa tego samego dnia, kolej, bilet kupiony przez pracodawcę, taksówka opłacona przez pracownika i posiłek zapewniony przez organizatora.

## 29. Dokumentacja i dystrybucja

Przygotuj README, instrukcję uruchomienia i budowania na Windows/macOS, konfigurację map i kursów, lokalizację bazy i załączników, kopię i odtworzenie, opis zasad i ograniczeń wymagających decyzji księgowości, aktualizację stawek, strukturę projektu, instalatory lub sposób ich generowania oraz informacje o podpisywaniu i notarizacji macOS.

Jeśli docelowy system nie jest dostępny w środowisku, nie deklaruj testów na nim; przygotuj konfigurację i opisz weryfikację oraz pozostałe testy.

## 30. Oczekiwany rezultat

Działająca aplikacja umożliwia dodanie pracownika i samochodu, utworzenie i zatwierdzenie zlecenia, wyznaczenie trasy z punktami lub jej ręczne wprowadzenie, wpisanie czasu, noclegów, posiłków, rachunków, wydatków i zaliczki, obliczenie diet, kilometrówki i należności, wyjaśnienie obliczeń, wygenerowanie PDF oraz zapis i odtworzenie danych z załącznikami.

Na koniec przedstaw rzeczywiście zaimplementowane funkcje, wykonane testy i wyniki, integracje wymagające konfiguracji, kwestie wymagające sprawdzenia na Windows/macOS i potwierdzenia księgowości oraz instrukcję uruchomienia i budowania.

## Źródła do weryfikacji

- [Ministerstwo Rodziny — podróż służbowa](https://www.gov.pl/web/rodzina/podroz-sluzbowa).
- [Rozporządzenie dotyczące należności za podróż służbową — tekst aktu](https://eli.gov.pl/api/acts/DU/2023/2190/text.html).
- [Ministerstwo Finansów — stawki i limity kilometrówki](https://podatki.gov.pl/podatki-firmowe/cit/cit-klasyczny/stawki-i-limity).
- [NBP Web API](https://api.nbp.pl/).

Według danych przywołanych w przygotowanej specyfikacji dieta krajowa wynosiła 45 zł, a stawki za kilometr od 17.01.2023 r. wynosiły 0,89 zł dla aut do 900 cm³ i 1,15 zł dla aut powyżej 900 cm³. Przed wdrożeniem zweryfikuj aktualne przepisy, nowelizacje, daty obowiązywania i stosowne przepisy przejściowe.
