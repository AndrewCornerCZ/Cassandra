# 🧪 MediLog - Testovací průvodce

Kompletní návod pro testování všech funkcí MediLog aplikace.

## 📋 Příprava testování

### Spuštění aplikace

1. **Cassandra** - Ujistěte se, že běží
   ```bash
   # Windows
   C:\Program Files\cassandra\bin\cassandra.bat
   
   # Linux
   sudo service cassandra start
   ```

2. **Backend**
   ```bash
   cd medilog-backend
   npm install
   npm run seed
   npm run dev
   ```
   Backend poběží na `http://localhost:5000`

3. **Frontend**
   ```bash
   cd medilog-frontend
   npm install
   npm start
   ```
   Frontend poběží na `http://localhost:3000`

## 🔍 Testovací scénáře

### 1️⃣ PŘIHLÁŠENÍ

#### Test 1.1: Přihlášení jako lékař
- Otevři `http://localhost:3000`
- Vyplň: Uživatelské jméno: **dr_novak**
- Heslo: **password123**
- Klikni "Přihlásit se"
- ✅ Měl bys vidět palubní desku s tlačítky pro pacienty, termíny a analytiku

#### Test 1.2: Přihlášení jako sestra
- Odhlášení (tlačítko vpravo nahoře)
- Uživatelské jméno: **nurse_jana**
- Heslo: **password123**
- ✅ Měla bys vidět palubní desku BEZ tlačítka "Termíny"

#### Test 1.3: Nesprávné přihlašovací údaje
- Zadej: username "invalid", password "wrong"
- ✅ Chyba: "Invalid credentials"

---

### 2️⃣ SPRÁVA PACIENTŮ

#### Test 2.1: Zobrazení seznamu pacientů
- Po přihlášení vidíš 3 testovací pacienty:
  - Jan Svoboda
  - Marie Nováková
  - Petr Kučera
- ✅ Každý pacient má zobrazeno rodné číslo, krevní skupinu a alergie

#### Test 2.2: Vyhledávání pacienta podle příjmení
- V poli "Příjmení" zadej: **Svoboda**
- Klikni "Hledat"
- ✅ Zobrazí se pouze Jan Svoboda

#### Test 2.3: Vyhledávání pacienta podle rodného čísla
- Vynuluj pole "Příjmení"
- V poli "Rodné číslo" zadej: **6503151234**
- Klikni "Hledat"
- ✅ Zobrazí se pouze Jan Svoboda

#### Test 2.4: Vytvoření nového pacienta
- Klikni "+ Nový pacient"
- Vyplň formulář:
  - Jméno: **Tomáš**
  - Příjmení: **Novotný**
  - Rodné číslo: **8501251111**
  - Datum narození: **25.1.1985**
  - Krevní skupina: **B-**
  - Alergie: **Sulfonamidy, Cefalosporiny**
  - Telefon: **+420 731 456 789**
  - Email: **tomas@email.cz**
- Klikni "Vytvořit pacienta"
- ✅ Zobrazí se zpráva "Pacient úspěšně vytvořen"
- ✅ Nový pacient se objeví v seznamu

---

### 3️⃣ DETAIL PACIENTA - VYŠETŘENÍ (Q1)

#### Test 3.1: Zobrazení vyšetření pacienta
- Klikni na pacienta "Jan Svoboda"
- Měl by vidět kartu s jeho údaji
- Záložka "Vyšetření" by měla obsahovat 1 položku (z seed dat)
- ✅ Vyšetření ukazuje: datum, lékaře, diagnózu a ICD-10 kód

#### Test 3.2: Přidání nového vyšetření
- Klikni "+ Nové vyšetření"
- Vyplň formulář:
  - Diagnóza: **Hypertenzia**
  - Poznámky: **Krevní tlak 150/90, doporučeno dietním opatřením**
  - ICD-10 kód: **I10**
- Klikni "Uložit vyšetření"
- ✅ Zobrazí se zpráva "Vyšetření úspěšně přidáno"
- ✅ Nové vyšetření se objeví v tabulce

---

### 4️⃣ DETAIL PACIENTA - PŘEDPISY (Q2)

#### Test 4.1: Zobrazení aktivních předpisů
- Jsem stále v detailu Jana Svobody
- Klikni na záložku "Předpisy"
- ✅ Vidím 1 předpis z seed dat: Paracetamol, aktivní

#### Test 4.2: Přidání nového předpisu
- Klikni "+ Nový předpis"
- Vyplň formulář:
  - ID léku: **drug_004**
  - Název léku: **Metoprolol**
  - Dávkování: **50mg x2 denně**
  - Počátek: [dneš
  - Konec: [za 30 dní]
- Klikni "Uložit předpis"
- ✅ Zobrazí se zpráva "Předpis úspěšně přidán"
- ✅ Nový předpis se objeví v seznamu

#### Test 4.3: Ověření inkrementace statistiky
- Nový předpis byl přidán do `prescription_stats`
- (Kontrola v analytice později)

---

### 5️⃣ DETAIL PACIENTA - DÁVKOVÁNÍ (Q3)

#### Test 5.1: Zaznamenání dávky léku
- Klikni na záložku "Dávkování"
- Klikni "+ Zaznamenat dávku"
- Vyplň formulář:
  - ID léku: **drug_001** (Paracetamol)
  - Dávka: **500mg**
  - Podáno: **pacient sám**
  - Poznámky: **Vzato s jídlem**
- Klikni "Zaznamenat dávku"
- ✅ Zobrazí se zpráva "Dávka úspěšně zaznamenána"

#### Test 5.2: Zobrazení dávkového protokolu za 30 dní
- V tabulce "Předpisy" klikni u Paracetamolu "Zobrazit záznam"
- ✅ Zobrazí se tabulka s:
  - Dnešním datem
  - ID léku: drug_001
  - Dávkou: 500mg
  - Kým bylo podáno: patient sám
  - Poznámkami

#### Test 5.3: Přidání více dávek
- Přidej opět dávku léku drug_001 v 14:00 (Paracetamol)
- ✅ V seznamu vidím obě dávky seřazené od nejnovější

---

### 6️⃣ DETAIL PACIENTA - INTERAKCE LÉ ČvijamKŮ (Q7)

#### Test 6.1: Zjištění interakce mezi dvěma léky
- V detailu pacienta s Paracetamolem a Ibuprofenom:
- ✅ Mělo by se zobrazit upozornění:
  - "⚠️ Upozornění na interakce"
  - drug_001 ↔ drug_002
  - "Both are analgesics - may cause overdose risk"
  - Závažnost: moderate

#### Test 6.2: Přidání léku s těžkou interakcí
- Přidej předpis s drug_005 (pokud existuje silná interakce)
- ✅ Upozornění by se mělo zobrazit s ČERVENÝM POZADÍM

---

### 7️⃣ DETAIL PACIENTA - AUDIT LOG (Q5)

#### Test 7.1: Zobrazení audit logu
- Klikni na záložku "Audit log"
- ✅ Vidím seznam všech změn:
  - Vytvoření pacienta (CREATE)
  - Přidání vyšetření (CREATE EXAMINATION)
  - Přidání předpisu (CREATE PRESCRIPTION)
  - Zaznamenání dávky (LOG_MEDICATION)

#### Test 7.2: Ověření informací v audit logu
- Každý záznam obsahuje:
  - Čas akce
  - Typ akce (CREATE, UPDATE, DELETE)
  - Uživatele, který akci provedl
  - Typ entity

---

### 8️⃣ TERMÍNY (Q6) - Pouze pro lékaře

#### Test 8.1: Přepnutí na účet lékaře
- Jdi na hlavní stránku (pokud je nutné)
- Přihlaš se jako **dr_novak**
- ✅ V horním menu vidím "Termíny"

#### Test 8.2: Zobrazení termínů na den
- Klikni na "Termíny"
- Vidím výchozí datum (dnes)
- ✅ Zobrazit se mají 3 termíny z seed dat na dnes
- ✅ Tabulka ukazuje: čas, pacienta, důvod, stav

#### Test 8.3: Výběr jiného data
- Změň datum v poli "Výběr data"
- Klikni "Načíst termíny"
- ✅ Pokud nejsou termíny, zobrazí se "Žádné termíny na tento den"

#### Test 8.4: Vytvoření nového termínu
- Aktuální datum znovu
- Klikni "+ Nový termín"
- Vyplň formulář:
  - Jméno pacienta: **Anna Svobodová**
  - ID pacienta: [paste ID of Jan Svoboda]
  - Čas: **15:00**
  - Důvod návštěvy: **Kontrolní vyšetření**
- Klikni "Vytvořit termín"
- ✅ Zobrazí se zpráva "Termín úspěšně vytvořen"
- ✅ Nový termín se append do tabulky

---

### 9️⃣ ANALYTIKA (Q8)

#### Test 9.1: Zobrazení statistiky předpisů
- Klikni na "Analytika" (pro obě role)
- ✅ Vidím 3 stat karty nahoře:
  1. Celkem předpisů
  2. Počet diagnóz
  3. Aktuální měsíc

#### Test 9.2: Statistika předpisů za měsíc
- V sekci "Statistika předepsaných léků"
- ✅ Vidím tabulku:
  - drug_001 (Paracetamol) - count
  - drug_002 (Ibuprofen) - count
  - drug_003 (Amoxicillin) - count
  - drug_004 (Metoprolol) - count (nově přidaný)

#### Test 9.3: Změna měsíce
- Změň pole "Výběr měsíce" na předchozí měsíc
- Klikni "Aktualizovat"
- ✅ Statistika se aktualizuje

#### Test 9.4: Statistika diagnóz
- V sekci "Statistika diagnóz"
- ✅ Vidím tabulku s ICD-10 kódy a počty
  - Z00.00 (Routine examination) - 3x (seed)
  - I10 (Hypertenzia) - 1x (přidaný)

---

### 🔟 POKROČILÉ TESTY

#### Test 10.1: Ověření persistentnosti dat
- Odhlášení (Logout)
- Přihlášení s jiným účtem
- ✅ Všechna data jsou stále dostupná

#### Test 10.2: Bezpečnost - Token expiraci
- V devTools (F12) > Application > Local Storage
- Zobrazit token
- Manuálně jej smazat
- Pokus se o refresh stránky
- ✅ Automatické přesměrování na login

#### Test 10.3: Audit trail pro smazání
- Vrátit se do detailu pacienta
- Smazat pacienta (pokud je implementovaná UI)
- ✅ Audit log by měl mít NEW záznam s DELETE akcí

#### Test 10.4: TTL na dávkách
- Vytvořit dávku
- V Cassandře se dávka uloží s TTL 90 dní
- (Ověřit: SELECT * FROM medication_log WHERE patient_id = '...' USING TTL;)

---

### ❌ NEGATIVNÍ TESTY

#### Test N1: Chybějící ID pacienta
- Pokus se přejít na `/patients/invalid-uuid`
- ✅ Chyba: "Pacient nenalezen"

#### Test N2: Duplikátní rodné číslo
- Pokus se vytvořit pacienta se stejným rodným číslem
- ✅ Chyba: "Duplicate entry" (pokud je klíč unikátní)

#### Test N3: Neúplný formulář
- Pokus se vytvořit pacienta bez jména
- ✅ Chyba: "Missing required fields"

---

## 📊 Verifikace dat v Cassandře

Pokud chceš ověřit data přímo v Cassandře, použij cqlsh:

```cql
-- Připoj se
cqlsh

-- Vyber keyspace
USE medilog;

-- Kontrola pacientů
SELECT * FROM patients;

-- Kontrola vyšetření
SELECT * FROM examinations_by_patient WHERE patient_id = 'PATIENT_UUID';

-- Kontrola předpisů
SELECT * FROM prescriptions_by_patient WHERE patient_id = 'PATIENT_UUID';

-- Kontrola dávek (se TTL)
SELECT *, TTL(dose_taken) FROM medication_log WHERE patient_id = 'PATIENT_UUID';

-- Kontrola audit logu
SELECT * FROM patient_audit_log WHERE patient_id = 'PATIENT_UUID';

-- Kontrola termínů
SELECT * FROM appointments_by_doctor_day WHERE doctor_id = 'DOCTOR_UUID' AND appt_date = TODAY();

-- Kontrola interakcí
SELECT * FROM drug_interactions;

-- Kontrola statistiky
SELECT * FROM prescription_stats WHERE month = '2024-03';
```

---

## ✅ Checklist úspěšného testování

- [ ] Přihlášení jako lékař a sestra
- [ ] Vytvoření nového pacienta
- [ ] Vyhledávání pacientů
- [ ] Zobrazení detailu pacienta
- [ ] Přidání vyšetření
- [ ] Přidání předpisu
- [ ] Zaznamenání dávky
- [ ] Zobrazení dávkového protokolu
- [ ] Detekce interakcí léků
- [ ] Zobrazení audit logu
- [ ] Zobrazení termínů (lékař)
- [ ] Vytvoření termínu (lékař)
- [ ] Analytika - statistika předpisů
- [ ] Analytika - statistika diagnóz
- [ ] Bezpečnost - logout
- [ ] Bezpečnost - neautorizovaný přístup

---

## 🐛 Debug tipy

### Backend debug
```bash
# V medilog-backend/.env
NODE_ENV=development

# Kontrola chyb v console:
npm run dev
```

### Frontend debug
- Otevři DevTools (F12)
- Tab "Network" - vidíš API volání
- Tab "Console" - JS chyby
- Tab "Application" - Local Storage, Cookies

### Cassandra debug
```bash
# Logování Cassandry
C:\Program Files\cassandra\logs\system.log

# cqlsh - interaktivní shell pro Cassandru
cqlsh
```

---

## 📝 Poznámky

- Všechny testy předpokládají, že seed.js je spuštěn
- Časy v tabulkách se mohou lišit podle místního času
- Alergie se zobrazují jako seznam oddělený čárkami
- Audit log zaznamenává IP adresu (v testingu localhost)

📧 Pokud něco nefunguje, kontroluj backend console a Cassandra logs.
