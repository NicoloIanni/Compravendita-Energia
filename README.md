# Compravendita Energia ⚡️

Backend REST per una piattaforma di **compravendita di energia elettrica “oggi per domani” (T+1)**:  
i **produttori** pubblicano capacità e prezzo su **slot da 1 ora** per il giorno successivo, i **consumatori** prenotano energia usando **credito/token**, e il produttore può **risolvere** le richieste applicando (se serve) un **taglio proporzionale**.

---

## Indice
- [Obiettivo del progetto](#obiettivo-del-progetto)
- [Requisiti](#requisiti)
- [Regole di dominio](#regole-di-dominio)
- [Stack](#stack)
- [Struttura repository](#struttura-repository)
- [Avvio rapido (Docker)](#avvio-rapido-docker)
- [Avvio in dev (opzionale)](#avvio-in-dev-opzionale)
- [Test](#test)
- [Postman & Newman](#postman--newman)
- [UML](#uml)
- [Desing Pattern](#desing-pattern)
- [Roadmap](#roadmap)
- [Autori](#autori)

---

## Obiettivo del progetto
L’obiettivo è realizzare un’applicazione che:

- Gestisce utenti con ruoli (**admin / producer / consumer**)
- Consente ai produttori di definire per ogni ora di domani **capacità (kWh)** e **prezzo (€/kWh o token/kWh)**
- Consente ai consumatori di fare **prenotazioni** (con vincoli e regole temporali)
- Gestisce credito, addebiti, rimborsi e concorrenza in modo **consistente** (transaction DB)
- Produce **statistiche** su occupazione, vendite, ricavi e **carbon footprint**

---

## Requisiti

### Ruoli
- **Admin**: crea produttori e consumatori (seed o endpoint dedicato).
- **Producer**: gestisce slot (capacità/prezzo), vede richieste, risolve allocazioni, consulta statistiche/ricavi.
- **Consumer**: prenota/modifica/cancella, vede acquisti e impronta CO₂.

### “Oggi per domani”
Per semplicità operativa, il sistema lavora su **slot del giorno successivo (domani)**.

### Slot orario
Ogni slot è identificato da:
- `date` (YYYY-MM-DD)
- `hour` (0–23)

### Credito / token
- il consumer ha un saldo
- la prenotazione **scala** il credito (in transaction)
- cancellazioni/modifiche possono generare **rimborsi** in base alle regole

### Taglio proporzionale (oversubscription)
Se la somma richiesta supera la capacità:
- il producer applica un **taglio lineare proporzionale**
- l’allocato può essere < richiesto → si rimborsa la differenza

### Carbon footprint
Il sistema calcola CO₂ come:
- `kWh * co2_g_per_kwh` (in grammi)

---

## Regole di dominio
- **Prenotazione solo entro una finestra temporale**:
  Uno slot è prenotabile solo se **mancano almeno 24h** all’inizio dello slot.  
  (Scelta progettuale: usiamo `slotStart - now >= 24h`)

- **Cancellazione/Modifica**:
  Stessa regola temporale: fuori finestra → niente rimborso (o regola definita), dentro finestra → rimborso secondo policy.

- **Consistenza con richieste concorrenti**:
  Credito e prenotazioni sono “soldi finti”, ma il problema è reale: due richieste contemporanee possono rompere tutto.  
  → usiamo **transaction** e lock dove serve.

- **Risoluzione NON automatica**:
   - Le prenotazioni vengono create in stato **PENDING**
   - la risoluzione (ALLOCATED / taglio) avviene con un endpoint del producer

---

## Stack
- **Node.js + Express** (API)
- **TypeScript** (tipi, meno errori idioti)
- **Sequelize** (ORM)
- **PostgreSQL** (DB) via **Docker Compose**
- **Jest + Supertest** (test API)
- **Postman** (test manuale + definizione collection)
- **Newman** (esecuzione Postman da CLI, ripetibile, “come un test”)

---

## Struttura repository DA AGGIORNARE
```text
.
├─ docker-compose.yaml
├─ Dockerfile
├─ .env
├─ package.json
├─ tsconfig.json
└─ src
   ├─ app.ts
   ├─ server.ts
   ├─ config
   │  ├─ env.ts
   │  └─ db.ts
   ├─ routes
   │  └─ health.routes.ts
   ├─ middlewares
   │  └─ errorHandler.ts
   └─ tests
      └─ health.test.ts
```

---

## Avvio rapido (Docker)

### 1) Avvia servizi
```bash
docker compose up --build
```

### 2) Healthcheck
```bash
curl -i http://localhost:3000/health
```

Risposta attesa: `200 OK` con JSON.

> Se il DB non parte, non è “sfortuna”: è quasi sempre `.env` sbagliato o volume rotto.  
> In quel caso: `docker compose down -v` e riparti.

---

## Avvio in dev (opzionale)

Se vuoi lanciare Node fuori da Docker:

```bash
npm install
npm run dev
```

---

## Test DA MODIFICARE
Esecuzione:
```bash
npm test
```

---

## Postman & Newman

### Postman
Postman è il modo più veloce per:
- provare gli endpoint a mano (debug immediato)
- salvare richieste in una **Collection** (documentazione eseguibile)
- gestire variabili (base URL, token, ecc.)

In breve: Postman ti permette di “toccare” l’API mentre la costruisci, senza scrivere codice client.

### Newman
Newman è Postman **da linea di comando**.  
Serve perché:
- rende i test di API **ripetibili** e automatizzabili
- permette di eseguire la collection in CI o comunque senza GUI
- è spesso richiesto come parte della consegna: “non mi raccontare che funziona, fammelo girare”

Esecuzione tipica:
```bash
npx newman run postman/CompravenditaEnergia.postman_collection.json \
  -e postman/CompravenditaEnergia.postman_environment.json
```

> Postman = test manuale e comodo.  
> Newman = stesso test, ma automatizzato e ripetibile.


### Endpoint coperti dalla collection
- `GET /health` → deve rispondere `200`
- `POST /auth/login` → **stub**: accetta credenziali e ritorna `{ "token": "<JWT>" }`
- `GET /protected/ping` → **protetto**: richiede `Authorization: Bearer <JWT>` e risponde `200`

> Nota: la collection di default usa `username=admin` e `password=admin`.  
> Se cambiate le credenziali, aggiornate **o** la collection **o** le variabili d’ambiente nel container.

### Installazione Newman (consigliata: locale al progetto)
```bash
npm i -D newman
```

### Esecuzione test (con npx)
```bash
npx newman run postman/CompravenditaEnergia.postman_collection.json \
  -e postman/CompravenditaEnergia.postman_environment.json
```
###OUTPUT ATTESO DA METTERE???

### Troubleshooting (le 3 cause tipiche)
1. **401 su /auth/login** → credenziali sbagliate o env non caricate nel container (`ADMIN_USER`, `ADMIN_PASS`).
2. **401 su /protected/ping** → token non salvato (login fallito) o `JWT_SECRET` diverso tra generazione e verify.
3. **404 sulle route** → avete montato male i router o avete messo l’`errorHandler` prima delle route (in Express l’ordine conta).

---
## UML
### Use Case Diagram
Il diagramma dei casi d’uso descrive gli attori del sistema (Admin, Producer, Consumer) e le principali funzionalità offerte dalla piattaforma.

![Use Case](docs/uml/img/use-case.png)

### Sequence Diagram – Reservation
Mostra il flusso di prenotazione dell’energia, inclusa la validazione del token e la scalatura del credito.

![Reservation Sequence](docs/uml/img/reservation.png)

### Sequence Diagram – Cancellation
Descrive il processo di cancellazione di una prenotazione con eventuale rimborso o applicazione di penali.

![Cancellation Sequence](docs/uml/img/Sequence-cancel.png)

### Design Pattern
### 1) Repository Pattern
Scopo: isolare Sequelize e il DB dal resto del codice.

Esempi previsti:
- `ProducerRepository`
- `ReservationRepository`

Vantaggio:
- il service non dipende da Sequelize direttamente
- testare diventa più facile (mock repository)

### 2) Service Layer
Scopo: tenere la business logic fuori dai controller.

Esempi previsti:
- `ReservationService` (24h rule, credito, PENDING)
- `SettlementService` (resolve, taglio, refund)

Vantaggio:
- controller = “parsing HTTP”
- service = “regole del progetto”

### 3) Strategy Pattern (allocazione)
Scopo: avere due strategie di allocazione senza if-else infinito.

- `NoCutStrategy` → se richieste <= capacità
- `ProportionalCutStrategy` → taglio lineare proporzionale

Vantaggio:
- cambia la strategia senza cambiare mezzo progetto

### 4) Factory (output stats)
Scopo: lo stesso endpoint può produrre output diversi (minimo JSON, opzionale PNG).

- `StatsOutputFactory` → crea JSON sempre, PNG se implementato

---

## Roadmap
- **Giorno 1**: repo + setup + docker-compose + health + stub auth + test base ✅
- **Giorno 2**: modelli Sequelize + associazioni + seed + JWT reale
- **Giorno 3**: producer slot capacity/price (batch) + validazioni
- **Giorno 4**: consumer prenotazione PENDING + scala credito (transaction)
- **Giorno 5**: modifica/cancellazione + regola 24h + refund/penale
- **Giorno 6**: producer view richieste + % occupazione
- **Giorno 7**: resolve proporzionale + allocazioni + refund differenze (transaction)
- **Giorno 8**: purchases filter + carbon + earnings + stats JSON
- **Giorno 9**: 6 test Jest + Postman collection + Newman
- **Giorno 10**: pulizia + UML finale + documentazione consegnabile

---

## Autori
- **Nicolò Ianni**
- **Danilo La Palombara**
