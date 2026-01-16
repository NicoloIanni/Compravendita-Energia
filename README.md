# Compravendita Energia ⚡️

---

## Indice
- [Obiettivo del progetto](#obiettivo-del-progetto)
- [Requisiti](#requisiti)
- [Regole di dominio](#regole-di-dominio)
- [Stack](#stack)
- [Struttura repository](#struttura-repository)
- [API](#api)
- [Avvio rapido (Docker)](#avvio-rapido-docker)
- [Avvio in dev (opzionale)](#avvio-in-dev-opzionale)
- [Test](#test)
- [Postman & Newman](#postman--newman)
- [UML](#uml)
- [Design Pattern](#design-pattern)
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
 
L’applicazione è progettata come **API REST**, con particolare attenzione agli aspetti di autenticazione, autorizzazione, correttezza delle operazioni e verificabilità del comportamento tramite test automatici.

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

## Struttura repository DA AGGIORNARE, SERVE?
```text
.
├─ docker-compose.yaml
├─ Dockerfile
├─ .env
├─ package.json
├─ tsconfig.json
├─ postman
│  ├─ CompravenditaEnergia.postman_collection.json
│  └─ CompravenditaEnergia.postman_environment.json
├─ docs
│  └─ uml
│     └─ img
│        ├─ use-case.png
│        ├─ reservation.png
│        └─ Sequence-cancel.png
└─ src
   ├─ app.ts
   ├─ server.ts
   ├─ config
   │  ├─ env.ts
   │  └─ db.ts
   ├─ middlewares
   │  ├─ auth.ts
   │  └─ errorHandler.ts
   ├─ routes
   │  ├─ health.routes.ts
   │  ├─ auth.routes.ts
   │  └─ protected.routes.ts
   ├─ services
   │  └─ producerSlotService.ts
   ├─ repositories
   │  └─ producerSlotRepository.ts
   ├─ controller
   │  └─ producerSlotsController.ts
   ├─ seed
   │  └─ seed.ts
   └─ tests
      ├─ health.test.ts
      ├─ producerSlots.capacity.test.ts
      └─ producerSlots.price.test.ts
```

---
## API DA AGGIORNARE

Questa sezione descrive gli endpoint relativi alla gestione della **capacità** e del **prezzo** degli slot energetici per i produttori. Sono illustrate le rotte disponibili, i requisiti di autenticazione/autorizzazione, le regole di validazione e alcuni esempi di richiesta/risposta.

### Rotte DA MODIFICARE
Di seguito un riepilogo delle rotte principali implementate nel progetto:

| Metodo | Percorso | Descrizione |
|--------|----------|-------------|
| `PATCH` | `/producers/me/slots/capacity` | Aggiorna in batch la capacità degli slot (kWh) per un producer autenticato |
| `PATCH` | `/producers/me/slots/price` | Aggiorna in batch il prezzo degli slot (€/kWh o token/kWh) per un producer autenticato |

## Comportamento dei controller

I controller relativi alle rotte sopra seguono queste regole:

- **Autenticazione JWT obbligatoria**
  - Il token deve essere inviato nell’header `Authorization: Bearer <token>`
  - Se manca o è invalido → `401 Unauthorized`

- **Autorizzazione per ruolo `producer`**
  - Solo utenti con `role: "producer"` possono aggiornare slot
  - Caso negativo → `403 Forbidden`

- **Validazione dei dati**
  - Per ogni slot passato nel body vengono verificati:
    - `date` presente e formato valido
    - `hour` tra 0 e 23
    - `capacityKwh` >= 0 (per capacity)
    - `pricePerKwh` >= 0 (per price)
  - In caso di input non valido → `400 Bad Request` con messaggio esplicativo

- **Transazioni atomiche**
  - Tutti gli aggiornamenti vengono eseguiti in una transazione
  - Se anche un singolo elemento è invalido, **nessuna modifica viene applicata**

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

### 3) Seed utenti di test (sviluppo)
```bash
docker compose exec api npm run seed
```
Output atteso: messaggio di completamento dello script (seed eseguito correttamente).

> Lo script di seed crea utenti base (admin/producer/consumer) con password hashate (bcrypt) per facilitare test e dimostrazioni.
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
I test automatici verificano che l’API risponda correttamente sugli endpoint principali e che i casi di errore siano gestiti in modo coerente.

Esecuzione:
```bash
npm test
```
La suite di test automatici include scenari che verificano il comportamento corretto delle API per l’aggiornamento di capacity e price, tenendo conto sia dei casi validi che di alcuni casi di errore.

Di seguito alcuni esempi rappresentativi:

#### 🟢 Test – Capacity aggiornata correttamente

Questo test verifica che l’endpoint di aggiornamento della capacity accetti un input valido e ritorni lo stato 200 OK, con conferma di successo.
Assicura inoltre che il producer autenticato possa aggiornare correttamente la capacità dell’orario specificato.

**Endpoint**: PATCH /producers/me/slots/capacity

**Headers**: Authorization: Bearer <JWT>, Content-Type: application/json

**Body**:
```json
[
  { "date": "2026-01-20", "hour": 10, "capacityKwh": 50 }
]
```
Expected Response: HTTP/1.1 200 OK
```json
[
  { "success": true }
]
```

#### 🔴 Test – Price non valido: hour fuori range
Questo test verifica che l’endpoint price rifiuti correttamente un valore di hour fuori dal range accettato (0–23).
Il server ritorna 400 Bad Request con messaggio di errore esplicativo.

**Endpoint**: PATCH /producers/me/slots/capacity

**Headers**: Authorization: Bearer <JWT>, Content-Type: application/json

**Body**:
```json
[
  { "date": "2026-03-10", "hour": 25, "pricePerKwh": 20 }
]
```
Expected Response: HTTP/1.1 400 Bad Request
```json
[
  { "error": "hour deve essere tra 0 e 23" }
]
```

#### 🛑 Test – Ruolo non autorizzato (non producer)
Questo test verifica che un utente autenticato con ruolo diverso da producer
non possa aggiornare capacity/price e riceva 403 Forbidden.

**Endpoint**: PATCH /producers/me/slots/price

**Headers**: Authorization: Bearer <JWT (ruolo non producer)>, Content-Type: application/json

**Body**:
```json
[
  { "date": "2026-03-10", "hour": 14, "pricePerKwh": 30 }
]
```
Expected Response: HTTP/1.1 403 Forbidden
```json
[
  { "error": "Accesso non consentito" }
]
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
- `GET /health` → `200 OK`
- `POST /auth/login` → `200 OK` e ritorna `{ "accessToken": "<JWT>" }` con credenziali valide
- `POST /auth/login` (wrong password) → `401 Unauthorized`
- `POST /auth/login` (missing body) → `400 Bad Request`
- `POST /auth/login` (missing password) → `400 Bad Request`
- `GET /protected/ping` (con token) → `200 OK`
- `GET /protected/ping` (missing token) → `401 Unauthorized`

> Nota: la collection usa variabili d’ambiente Postman (`admin_email`, `admin_password`) e salva automaticamente il token in `jwt_token` (e per compatibilità anche in `jwt`).  
> Se cambiano le credenziali di seed è necessario aggiornare le variabili nell’environment Postman.

### Installazione Newman (consigliata: locale al progetto)
```bash
npm i -D newman
```

### Esecuzione test (con npx) SERVE?
```bash
npx newman run postman/CompravenditaEnergia.postman_collection.json \
  -e postman/CompravenditaEnergia.postman_environment.json
```
###OUTPUT ATTESO DA METTERE???
La suite Newman deve completarsi senza errori (0 failed), confermando:
- API raggiungibile (`/health`)
- login valido produce un token JWT
- casi negativi (`400/401`) gestiti correttamente
- endpoint protetto accessibile solo con Bearer token valido

### Troubleshooting (le 3 cause tipiche)
1. 1. **401 su /auth/login** → credenziali non valide (variabili Postman `admin_email`, `admin_password`) oppure utenti di test non inizializzati tramite seed.
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
L’architettura del progetto è stata pensata per separare chiaramente le responsabilità
tra i vari livelli dell’applicazione, seguendo un approccio modulare e progressivo.

### 4.1 Middleware Pattern

Il **Middleware Pattern** è utilizzato per gestire funzionalità trasversali alle API,
in particolare per l’autenticazione e l’autorizzazione degli utenti tramite JWT.

Il middleware intercetta le richieste dirette agli endpoint protetti, verifica la
presenza dell’header `Authorization` e la validità del Bearer token. In caso di
token valido, la richiesta viene inoltrata al controller; in caso contrario viene
restituita una risposta di errore appropriata.

Questo approccio consente di centralizzare la logica di sicurezza, evitando
duplicazioni di codice e mantenendo le rotte applicative focalizzate sulla sola
logica funzionale.

### 4.2 Separation of Concerns

Il progetto adotta una chiara **separazione delle responsabilità** tra i diversi
moduli dell’applicazione, secondo i principi della *Separation of Concerns*.

In particolare:
- le **routes** gestiscono le richieste HTTP e la validazione di base degli input;
- i **middlewares** implementano la logica trasversale (autenticazione, gestione errori);
- il modulo **config** centralizza la configurazione di ambiente e database;
- gli script di **seed** sono utilizzati per l’inizializzazione dei dati di test.

Questa organizzazione migliora la leggibilità del codice e semplifica la
manutenzione e l’evoluzione del sistema.

### 4.3 Pattern pianificati DA MODIFICARE

Nelle fasi successive del progetto verranno introdotti ulteriori pattern
architetturali per supportare la crescente complessità della logica di business.

In particolare sono previsti:
- il **Repository Pattern**, per isolare l’accesso ai dati e ridurre il coupling con Sequelize;
- un **Service Layer**, per incapsulare la logica di business e le regole applicative;
- lo **Strategy Pattern**, per gestire in modo flessibile le diverse politiche di
  allocazione dell’energia.
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
