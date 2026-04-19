# 🏥 MediLog - Zdravotní Informační Systém

Moderní full-stack aplikace pro správu zdravotních záznamů, léků, předpisů a léčebných plánů v ambulancích a malých poliklinikách.

## 📋 Požadavky

- Node.js 14+
- npm nebo yarn
- Cassandra 3.11+ (nebo Docker)

## 🐳 Spuštění s Dockerem (DOPORUČENO)

Nejjednoduší a nejrychlejší řešení:

```bash
# 1. Spusť Docker Compose
docker-compose up --build

# 2. Čekej na inicializaci (2-3 minuty)
# 3. Otevři http://localhost:3000

# 4. Vložit testovací data (v novém terminálu)
docker exec medilog-backend npm run seed
```

**Více infos:** Podívej se na [QUICK_START_DOCKER.md](./QUICK_START_DOCKER.md) nebo [DOCKER_SETUP.md](./DOCKER_SETUP.md)

---

## 🚀 Instalace a spuštění (bez Dockeru)

### 1. Inicializace Cassandry

```bash
# Ujistěte se, že Cassandra běží
# Ve Windows: C:\Program Files\cassandra\bin\cassandra.bat
# Na Linuxu: cassandra
```

### 2. Backend

```bash
cd medilog-backend

# Instalace závislostí
npm install

# Inicializace databáze a naplnění testovacími daty
npm run seed

# Spuštění vývojového serveru
npm run dev
# nebo produkční server
npm start
```

Backend poběží na `http://localhost:5000`

### 3. Frontend

```bash
cd medilog-frontend

# Instalace závislostí
npm install

# Spuštění vývojového serveru
npm start
```

Frontend poběží na `http://localhost:3000`

## 🔐 Testovací přihlašovací údaje

Po spuštění `npm run seed` v backend složce jsou dostupná tato testovací účty:

**Lékař:**
- Uživatelské jméno: `dr_novak`
- Heslo: `password123`

**Zdravotní sestra:**
- Uživatelské jméno: `nurse_jana`
- Heslo: `password123`

## 📊 Implementované funkce

### Q1: Získej všechna vyšetření pacienta P
```bash
GET /api/patients/:id/examinations
```

### Q2: Získej aktivní předpisy pacienta P
```bash
GET /api/patients/:id/prescriptions
```

### Q3: Získej historii dávkování léku L u pacienta P za posledních 30 dní
```bash
GET /api/patients/:id/medications/:drugId/log?days=30
```

### Q4: Najdi všechny pacienty alergické na látku X
```bash
GET /api/patients?lastName=&nationalId=
```
(Filtrujeme podle alergií ve frontendě z vrácených dat)

### Q5: Získej audit log změn záznamu pacienta P
```bash
GET /api/patients/:id/audit?from=&to=&action=
```

### Q6: Získej termíny pro lékaře D na konkrétní den
```bash
GET /api/doctors/:id/appointments?date=YYYY-MM-DD
```

### Q7: Zjisti interakci mezi léky L1 a L2
```bash
GET /api/drugs/:id1/interactions/:id2
```

### Q8: Získej statistiku předepsaných léků za poslední měsíc
```bash
GET /api/analytics/prescriptions?month=YYYY-MM
```

## 📁 Struktura projektu

```
medilog-full/
├── medilog-backend/
│   ├── db/
│   │   ├── init.js           # Inicializace databáze
│   │   └── connection.js     # Připojení k Cassandře
│   ├── middleware/
│   │   └── auth.js           # JWT autentizace
│   ├── routes/
│   │   ├── auth.js          # Přihlášení a registrace
│   │   ├── patients.js      # Management pacientů
│   │   ├── appointments.js  # Správa termínů
│   │   ├── drugs.js         # Interakce léků
│   │   └── analytics.js     # Analytika
│   ├── scripts/
│   │   └── seed.js          # Testovací data
│   ├── server.js            # Express server
│   ├── package.json
│   └── .env                 # Env proměnné
│
└── medilog-frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── pages/
    │   │   ├── Login.js          # Přihlášení
    │   │   ├── Dashboard.js      # Palubní deska pacientů
    │   │   ├── PatientDetail.js  # Detail pacienta
    │   │   ├── Appointments.js   # Správa termínů
    │   │   └── Analytics.js      # Analytika
    │   ├── App.js               # Hlavní komponenta
    │   ├── App.css              # Styly
    │   ├── index.js
    │   └── index.css
    ├── package.json
    └── .env (optional)
```

## 🗄️ Cassandra tabulky

1. **patients** - Základní údaje pacientů
2. **examinations_by_patient** - Vyšetření pacienti (Q1)
3. **prescriptions_by_patient** - Aktivní předpisy (Q2)
4. **medication_log** - Historie dávkování s TTL 90 dní (Q3)
5. **patient_audit_log** - Audit trail (Q5)
6. **appointments_by_doctor_day** - Termíny lékařů (Q6)
7. **drug_interactions** - Interakce mezi léky (Q7)
8. **prescription_stats** - Statistika předpisů (Q8)
9. **users** - Uživatelé systému

## 🧪 Testovací scénáře

### 1. Přihlášení
- Přejít na `http://localhost:3000`
- Přihlášit se jako `dr_novak` nebo `nurse_jana`

### 2. Správa pacientů
- Vytvořit nového pacienta tlačítkem "+ Nový pacient"
- Vyhledávat pacienty podle příjmení nebo rodného čísla
- Kliknout na pacienta pro podrobnosti

### 3. Vyšetření a předpisy
- V detailu pacienta přejít na záložku "Vyšetření"
- Přidat nové vyšetření s diagnózou a ICD-10 kódem
- Na záložce "Předpisy" přidat nový předpis léku

### 4. Dávkovací protokol
- Na záložce "Dávkování" zaznamenat podanou dávku
- Kliknout "Zobrazit záznam" u předpisu pro historii

### 5. Ověření interakcí
- Systém automaticky upozorňuje na interakce léků
- Upozornění se zobrazuje v detailu pacienta

### 6. Audit log
- Na záložce "Audit log" vidět historii změn pacienta
- Logged je akce, uživatel a čas

### 7. Termíny (pouze pro lékaře)
- Kliknout na "Termíny" v horním menu
- Vytvořit nový termín pro pacienta
- Zobrazit termíny na konkrétní den

### 8. Analytika
- Kliknout na "Analytika" v horním menu
- Vybrat měsíc pro statistiku
- Zobrazit přehled předpisů a diagnóz

## 🔄 API Endpoints - Úplný seznam

### Autentifikace
- `POST /api/auth/login` - Přihlášení
- `POST /api/auth/register` - Registrace (testing)

### Pacienti
- `GET /api/patients` - Seznam pacientů (s filtry)
- `GET /api/patients/:id` - Detail pacienta
- `POST /api/patients` - Vytvoření pacienta
- `PUT /api/patients/:id` - Aktualizace pacienta
- `DELETE /api/patients/:id` - Smazání pacienta

### Vyšetření
- `GET /api/patients/:id/examinations` - Vyšetření pacienta
- `POST /api/patients/:id/examinations` - Přidání vyšetření

### Předpisy
- `GET /api/patients/:id/prescriptions` - Předpisy pacienta
- `POST /api/patients/:id/prescriptions` - Nový předpis

### Dávkování
- `POST /api/patients/:id/medications/log` - Zaznamenání dávky
- `GET /api/patients/:id/medications/:drugId/log` - Historie dávek

### Interakce
- `GET /api/patients/:id/interaction-check` - Kontrola interakcí
- `GET /api/drugs/:id1/interactions/:id2` - Detail interakce

### Termíny
- `GET /api/doctors/:id/appointments?date=YYYY-MM-DD` - Termíny na den
- `POST /api/appointments` - Nový termín
- `PUT /api/appointments/:id` - Aktualizace termínu

### Audit
- `GET /api/patients/:id/audit` - Audit log pacienta

### Analytika
- `GET /api/analytics/prescriptions?month=YYYY-MM` - Statistika předpisů
- `GET /api/analytics/diagnoses?month=YYYY-MM` - Statistika diagnóz

## ⚙️ Env proměnné

**Backend (.env):**
```
CASSANDRA_HOSTS=127.0.0.1
CASSANDRA_PORT=9042
CASSANDRA_KEYSPACE=medilog
JWT_SECRET=tvoje-tajne-klic-zmeni-na-produkcji
PORT=5000
NODE_ENV=development
```

## 🛠️ Troubleshooting

### Cassandra se nepřipojuje
```
Ujistěte se, že Cassandra běží:
- Windows: C:\Program Files\cassandra\bin\cassandra.bat
- Linux: sudo service cassandra start
```

### Chyba "keyspace does not exist"
```
Spusťte seed skript:
cd medilog-backend
npm run seed
```

### CORS chyby
```
Frontend komunikuje s backendem přes proxy (localhost:5000).
Ověřte, že backend běží na portu 5000.
```

## 📝 Poznámky

- Hesla jsou v testovacím data uložena bez sha (pro testování)
- V produkci používejte bcrypt pro hašování hesel
- Audit log zaznamenává všechny změny pacientů
- Medication log má TTL 90 dní (automatické smazání)
- Interakce léků jsou v tabulce drug_interactions

## 📞 Podpora

Pro problémy se Cassandrou viz: https://cassandra.apache.org/doc/latest/

## 📄 Licence

ISC
