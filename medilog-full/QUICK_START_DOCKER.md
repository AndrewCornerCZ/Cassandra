# 🚀 MediLog - Docker Quick Start

## ⚡ Nejrychlejší začátek (5 minut)

### Krok 1: Spusť Docker Compose
```bash
cd medilog-full
docker-compose up --build
```

### Krok 2: Čekej na inicializaci (2-3 minuty)
```
✅ Poznáš připraveno, když vidíš:
- "... Cassandra ready..."
- "... Backend running on http://localhost:5000..."
- "... Frontend compiled successfully..."
```

### Krok 3: Otevři aplikaci
```
🎨 Frontend: http://localhost:3000
🔧 API Docs: http://localhost:5000/health
```

### Krok 4: Vložení testovacích dat (v novém terminálu)
```bash
docker exec medilog-backend npm run seed
```

---

## 🔗 Co se spustilo

| Služba | Port | URL |
|--------|------|-----|
| Frontend (React) | 3000 | http://localhost:3000 |
| Backend (Node.js) | 5000 | http://localhost:5000/api |
| Cassandra | 9042 | localhost:9042 |

---

## 💾 Cassandra Shell

Pokud chceš přímo pracovat s databází:

```bash
docker exec -it medilog-cassandra cqlsh

# Uvnitř Cassandry:
USE medilog;
SELECT * FROM patients LIMIT 10;
SELECT * FROM prescriptions_by_patient WHERE patient_id = <patient_id>;
```

---

## 🛑 Zastavení / Čištění

```bash
# Zastavit (data se zachovají)
docker-compose down

# Zastavit a smazat vše (včetně dat!)
docker-compose down -v

# Jen zastavit bez ukončení
docker-compose stop
```

---

## 🐛 Řešení problémů

### Cassandra se nespustí
```bash
# Smaž vše a začni znovu
docker-compose down -v
docker system prune -a
docker-compose up --build
```

### Backend se nemůže připojit
```bash
# Podívej se na logs
docker-compose logs backend
docker-compose logs cassandra
```

### Frontend nefunguje
```bash
docker-compose logs frontend
# Zkontroluj, že API_URL je správná v .env
```

### Port 3000/5000/9042 je užitý
```bash
# Změní v docker-compose.yml:
# "3000:3000" → "3001:3000"
# Pak znovu spusť
```

---

## 📝 Testování bez Dockeru (lokální Cassandra)

Pokud máš Cassandru spuštěnou na `localhost:9042`:

```bash
# Backend
cd medilog-backend
npm install
npm run dev  # nebo npm start

# Frontend (nový terminál)
cd medilog-frontend
npm install
npm start
```

---

## 🎯 Typický workflow

### Den 1 - Prvotní setup
```bash
docker-compose up --build
docker exec medilog-backend npm run seed  # Vlož test data
# Otevři http://localhost:3000
```

### Den 2+ - Vývoj
```bash
docker-compose up
# Soubory se auto-update díky volumes
```

### Pokud potřebuješ resetovat DB
```bash
docker-compose down -v
docker-compose up --build
docker exec medilog-backend npm run seed
```

---

✨ Hotovo! Aplikace je plně funkční. Pytej se, pokud je něco nejasného.
