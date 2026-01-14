# Compravendita-Energia
Backend Node.js + Express + TypeScript + Sequelize + PostgreSQL per la compravendita di energia su slot orari (T+1).






Indice

Descrizione

Requisiti del progetto

Regole di dominio

Stack & Architettura

Struttura repository

Avvio rapido

Test

Postman & Newman

UML & Design Pattern

Roadmap

Autori

Descrizione

Il sistema gestisce:

Produttori con capacità (anche variabile per ora) e prezzo per kWh.

Consumatori con credito/token per acquistare energia.

Prenotazioni su slot da 1 ora per il giorno successivo (T+1).

Gestione cancellazioni/modifiche, statistiche ed emissioni (carbon footprint). 

1cc0aad6_202601_PA_G02

 

1cc0aad6_202601_PA_G02

Requisiti del progetto

Da specifica:

Backend con Node.js, Express, Sequelize e DB esterno 

1cc0aad6_202601_PA_G02

TypeScript 

1cc0aad6_202601_PA_G02

Autenticazione JWT con ruolo nel token (producer | consumer | admin) 

1cc0aad6_202601_PA_G02

Validazioni input + middleware + error handling middleware 

1cc0aad6_202601_PA_G02

Almeno 6 test con Jest 

1cc0aad6_202601_PA_G02

Avvio con Docker Compose, test API con Postman/Newman, documentazione con UML + design pattern 

1cc0aad6_202601_PA_G02

Regole di dominio

Slot acquistabili rispettando la regola delle 24h rispetto all’inizio dello slot. 

1cc0aad6_202601_PA_G02

Quantità minima acquistabile: 0.1 kWh. 

1cc0aad6_202601_PA_G02

Se le richieste superano la capacità oraria → taglio proporzionale lineare (accettazione a discrezione del produttore). 

1cc0aad6_202601_PA_G02

Modifica/cancellazione:

>24h: nessun costo

≤24h: addebito totale 

1cc0aad6_202601_PA_G02

Stack & Architettura
Tecnologie

Express + TypeScript

PostgreSQL (in container)

Sequelize (ORM)

Zod per validation

Jest + Supertest per test API (Supertest può testare app senza dover aprire una porta)

Postman + Newman per run CLI delle collection

Docker Compose per orchestrazione servizi

Scelta architetturale (a livelli)

routes/ → definizione endpoint

middlewares/ → auth, RBAC, validation, error handling

services/ → logica business (prenotazioni, tagli, rimborsi, statistiche)

models/ (Sequelize) → mapping DB

Struttura repository
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

Avvio rapido
1) Configurazione .env

Esempio:

PORT=3000
DB_HOST=db
DB_PORT=5432
DB_NAME=energy
DB_USER=app
DB_PASSWORD=app
JWT_SECRET=change_me

2) Avvio stack (API + DB)

Nel progetto:

docker compose -f docker-compose.yaml up --build


Il flag -f permette di specificare il file compose esplicitamente.

Nota: il path “canonico” per compose è compose.yaml/compose.yml, ma docker-compose.yaml/yml resta supportato per compatibilità.

3) Smoke test
curl -i http://localhost:3000/health


Output atteso: 200 OK con { "status": "ok" }.

Test

Esecuzione:

npm test


Jest è il framework di test richiesto. 

1cc0aad6_202601_PA_G02

Supertest viene usato per testare le route Express in modo pulito (senza dover avviare un server su porta fissa).

Postman & Newman

Newman è il runner CLI per le Postman Collections (utile anche per CI).

Struttura suggerita
postman/
  CompravenditaEnergia.postman_collection.json
  CompravenditaEnergia.postman_environment.json

Installazione Newman
npm i -g newman

Esecuzione
newman run postman/CompravenditaEnergia.postman_collection.json \
  -e postman/CompravenditaEnergia.postman_environment.json


UML & Design Pattern

La consegna richiede UML + pattern documentati. 

1cc0aad6_202601_PA_G02

UML (da inserire in docs/uml/)

Use Case Diagram (Admin / Producer / Consumer)

Sequence Diagram: prenotazione + scalare credito

Sequence Diagram: cancellazione + rimborso/penale

Esempio embed:

![Use Case](docs/uml/use-case.png)
![Sequence - Reservation](docs/uml/sequence-reservation.png)
![Sequence - Cancel](docs/uml/sequence-cancel.png)

Design Pattern (minimo sensato)

Service Layer: logica business fuori dalle route

Repository: accesso DB isolato dai service

Strategy: algoritmo “allocazione/taglio” intercambiabile (es. ProportionalCutStrategy)

Roadmap

 Scaffold + Healthcheck

 Migrations + modelli DB (User, ProducerSlot, Reservation, …)

 Auth JWT + RBAC

 Endpoint Producer (slot, richieste, resolve, stats, earnings)

 Endpoint Consumer (prenota, modifica/cancella, acquisti filtrati, carbon footprint)

 ≥ 6 test Jest

 Postman collection + Newman run

 UML + pattern finalizzati nel README

Autori

Nicolò Ianni

Danilo La Palombara