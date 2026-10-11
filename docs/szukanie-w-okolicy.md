# Szukanie streamerów w okolicy

Jak działa ekran **Nearby** i filtr odległości w talii **Discover**.

Kod: [`convex/geo.ts`](../convex/geo.ts) (matematyka), [`convex/discover.ts`](../convex/discover.ts) (zapytania),
[`convex/profiles.ts`](../convex/profiles.ts) (`setLocation`), [`src/hooks/use-location.ts`](../src/hooks/use-location.ts) (telefon).

## W skrócie

Convex nie ma indeksu przestrzennego, więc świat jest podzielony na siatkę kwadratów 1° × 1°.
Każdy profil pamięta, w której komórce leży. Wyszukiwanie pobiera z bazy tylko komórki
zahaczające o zadany promień, a potem liczy dokładną odległość dla każdego kandydata.

## 1. Zapis pozycji

1. Aplikacja prosi o uprawnienie i odczytuje pozycję z niską dokładnością
   (`Location.Accuracy.Low` — wystarcza sieć/Wi-Fi, bez GPS).
2. Mutacja `profiles.setLocation` sprawdza zakres (`|lat| ≤ 90`, `|lng| ≤ 180`).
3. `coarsen()` zaokrągla współrzędne do 2 miejsc po przecinku, czyli do ok. 1 km.
   Dokładna pozycja nigdy nie trafia do bazy.
4. `cellOf()` wylicza komórkę siatki: `"floor(lat):floor(lng)"`. Warszawa (52.23, 21.01) → `52:21`.
5. W profilu zapisują się `lat`, `lng` i `cell`. Pole `cell` ma indeks `by_cell`.

Pozycja odświeża się sama przy otwarciu aplikacji, ale tylko gdy udostępnianie jest włączone.
Wyłączenie przełącznika „Share my location" usuwa `lat`, `lng` i `cell` z profilu.

## 2. Wyszukiwanie

Funkcja `profilesWithin(ctx, me, radiusKm)`:

1. **Komórki** — `cellsWithin()` wylicza prostokąt opisany na okręgu:
   - w pionie: `radiusKm / 111.32` stopni w górę i w dół,
   - w poziomie: `radiusKm / (111.32 × cos(lat))` stopni, bo południki zbiegają się ku biegunom
     (w Polsce 1° długości to ok. 68 km),
   - długość geograficzna zawija się na ±180°.
2. **Pobranie** — dla każdej komórki zapytanie po indeksie `by_cell`, do 200 profili na komórkę.
   Zapytania idą równolegle.
3. **Dokładny filtr** — `distanceKm()` liczy odległość wzorem haversine (po kuli ziemskiej)
   i odrzuca profile poza promieniem.

Ile komórek wokół Warszawy: 50 km → 4–6, 100 km → ok. 12, 300 km → ok. 60.

Potem `visibleTo()` odrzuca: samego siebie, profile ukryte (`discoverable: false`),
bez ukończonego onboardingu oraz zablokowane w dowolną stronę.

## 3. Co widzi użytkownik

| | Nearby (`discover.nearby`) | Discover (`discover.deck`) |
|---|---|---|
| Promień | wybrany na ekranie: 10 / 25 / 50 / 100 / 300 km | „Maximum distance" z profilu |
| Dodatkowy filtr | opcjonalnie „Live now" | bez osób już przesuniętych |
| Kolejność | od najbliższego | na żywo → wspólne zainteresowania → odległość |
| Limit | 60 osób | 20 kart (talia sama dociąga kolejne) |
| Bez lokalizacji | prośba o udostępnienie | 300 ostatnio aktywnych profili |

Talia korzysta z siatki tylko wtedy, gdy użytkownik ma lokalizację **i** ustawiony limit
odległości. Przy ustawieniu „Anywhere" bierze 300 ostatnio aktywnych profili z całego świata.

## 4. Prywatność

- W bazie jest tylko pozycja zaokrąglona do ok. 1 km.
- `publicProfile()` zwraca innym wyłącznie dystans w pełnych kilometrach (minimum 1 km),
  nigdy współrzędne.
- Udostępnianie lokalizacji jest dobrowolne i da się je wyłączyć w profilu.

## 5. Ograniczenia

| Ograniczenie | Wartość | Gdzie zmienić |
|---|---|---|
| Profili na komórkę | 200 | `PER_CELL` w `discover.ts` |
| Maksymalny promień | 500 km | `MAX_RADIUS_KM` w `discover.ts` |
| Rozmiar komórki | 1° | `cellOf` / `cellsWithin` w `geo.ts` |

- W bardzo gęstym miejscu (ponad 200 osób w jednej komórce) część profili zostanie pominięta.
  Rozwiązanie: mniejsze komórki, np. 0,1°. Wymaga to przeliczenia pola `cell` we wszystkich profilach.
- Nearby nie ma stronicowania — pokazuje 60 najbliższych.
- Blisko biegunów komórki robią się bardzo wąskie, więc zapytań jest więcej. W praktyce bez znaczenia.
