# 🐳 Docker Setup pro MediLog

## Příprava

### Předpoklady:
- ✅ Docker nainstalován
- ✅ Docker Compose nainstalován

## Jak spustit s Dockerem

### 1. Spuštění celé aplikace (Cassandra + Backend + Frontend)

```bash
# V kořenové složce projektu (medilog-full/)
docker-compose up --build
```

Co se stane:
- 📦 Cassandra spustí se na portu `9042`
- 🔧 Backend API spustí se na portu `5000`
- 🎨 Frontend React spustí se na portu `3000`
- 🔗 Všechny služby se automaticky propojí

### 2. První spuštění - inicializace databáze

Když spustíš `docker-compose up`, aplikace:
1. Čeká, dokud Cassandra není healthy (41 sekund)
2. Backend se automaticky připojí a vytvoří tabulky (`db/init.js`)
3. Můžeš pak vložit testovací data

### 3. Vložení seed dat

```bash
# V novém terminálu:
docker exec medilog-backend npm run seed
```

## Lokální vývoj (bez Dockeru)

Pokud chceš pracovat bez Dockeru a máš Cassandru na `localhost:9042`:

```bash
# V medilog-backend/
cp .env.local .env.override

# Spusť backend
npm install
npm run dev

# V medilog-frontend/ (z druhého terminálu)
npm install
npm start
```

## Spojovací body

### Frontend
- http://localhost:3000

### Backend API
- http://localhost:5000/api

### Cassandra Shell (z Dockeru)
```bash
docker exec -it medilog-cassandra cqlsh
```

## Řešení problémů

### Cassandra se nespustí
```bash
# Smaž staré kontejnery a volumes
docker-compose down -v
docker system prune -a
docker-compose up --build
```

### Backend se nemůže připojit k Cassandře
```bash
# Zkontroluj health
docker ps

# Podívej se na logs
docker-compose logs cassandra
docker-compose logs backend
```

### Port je již užíván
```bash
# Změní porty v docker-compose.yml:
# "9042:9042" → "9043:9042"  (Cassandra)
# "5000:5000" → "5001:5000"  (Backend)
# "3000:3000" → "3001:3000"  (Frontend)
```

## Konfigurační proměnné

### Docker (.env)
```
CASSANDRA_HOSTS=cassandra        # Hostname z docker-compose
CASSANDRA_PORT=9042
CASSANDRA_KEYSPACE=medilog
NODE_ENV=development
JWT_SECRET=your_jwt_secret
```

### Lokální vývoj (.env.local)
```
CASSANDRA_HOSTS=127.0.0.1        # Localhost
CASSANDRA_PORT=9042
CASSANDRA_KEYSPACE=medilog
NODE_ENV=development
JWT_SECRET=local_secret
```

## Zastavení aplikace

```bash
# Zastavit a odstranit kontejnery (data se zachovají)
docker-compose down

# Zastavit, odstranit kontejnery a smazat data
docker-compose down -v
```

## Tipy pro vývoj

✅ Backend běží v `dev` módu (nodemon - hodí se na změny)
✅ Frontend běží s `npm start` (hot reload)
✅ Cassandra data se ukládají do `cassandra_data` volume (přetrvají)
✅ Oba soubory `.env` a `.env.local` jsou gitignored

Enjoy! 🎉
