# Web Site Jedziniak

Domyślne hasło administratora to **admin**.

Aby ustawić własne hasło, ustaw zmienną środowiskową `ADMIN_PASSWORD` przed uruchomieniem aplikacji, np.:

```bash
export ADMIN_PASSWORD=moje_haslo
npm start
```

Możesz również skopiować plik `.env.example` do `.env` i w nim ustawić wartość `ADMIN_PASSWORD`.

## Tryb developerski

Podczas pracy z `npm run dev` wykorzystywany jest `nodemon`, który pilnuje zmian w katalogu `server/`. 
Plik `nodemon.json` sprawia, że operacje na plikach zdjęć (dodawanie lub usuwanie w `docs/images/`) oraz aktualizacja plików danych (`server/gallery.json`, `server/categories.json`) **nie restartują** serwera developerskiego. 
Dzięki temu sesja administratora pozostaje aktywna przy masowym dodawaniu i usuwaniu zdjęć.

Jeśli zauważysz wymuszone wylogowanie w trakcie pracy, upewnij się, że uruchamiasz serwer poleceniem `npm run dev` lub `npm start` w zależności od potrzeb:

- `npm start` – uruchamia serwer bez automatycznego przeładowania (zachowanie produkcyjne).
- `npm run dev` – uruchamia serwer z obserwacją zmian w kodzie aplikacji, pomijając zmiany w plikach galerii.
