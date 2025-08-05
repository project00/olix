# Configurazione del Database per OilX

Questo documento descrive come configurare e inizializzare il database PostgreSQL per il progetto OilX.

## Prerequisiti

### Opzione Docker (Consigliata)
- Docker e Docker Compose installati
- Nessuna installazione locale di PostgreSQL richiesta

### Opzione Installazione Locale
- PostgreSQL installato e in esecuzione
- Accesso a un utente con privilegi di creazione database

## File Disponibili

1. **db_init.sql**: Script SQL completo per la creazione del database, delle tabelle e l'inserimento di dati di esempio
2. **setup_database.js**: Script Node.js per automatizzare il processo di configurazione
3. **setup_database.sh**: Script bash alternativo per automatizzare il processo di configurazione
4. **docker-compose.yml**: File di configurazione per avviare un container Docker PostgreSQL

## Opzione 1: Utilizzo di Docker (Consigliato)

Il modo più semplice e consigliato per configurare il database è utilizzare Docker:

1. Avvia il container PostgreSQL utilizzando Docker Compose:
   ```bash
   docker-compose up -d
   ```
   Questo comando avvierà un container PostgreSQL con le seguenti configurazioni predefinite:
   - Username: user
   - Password: password
   - Database: carbooking
   - Porta: 5433 (mappata alla porta 5432 del container)

2. Inizializza il database utilizzando lo script Node.js:
   ```bash
   node setup_database.js
   ```
   Lo script rileverà automaticamente il container Docker e utilizzerà le credenziali corrette.

## Opzione 2: Utilizzo dello Script Automatico con PostgreSQL Locale

Se preferisci utilizzare un'installazione locale di PostgreSQL, puoi utilizzare lo script bash fornito:

```bash
# Rendi lo script eseguibile
chmod +x setup_database.sh

# Esegui lo script
./setup_database.sh
```

Lo script:
1. Verifica che PostgreSQL sia installato
2. Richiede le credenziali PostgreSQL
3. Crea il database e le tabelle
4. Aggiorna i file di configurazione (.env e config.json) con le impostazioni locali
5. Esegue alcune query di verifica

## Opzione 3: Configurazione Manuale

Se preferisci configurare manualmente il database:

1. Crea il database e le tabelle:
   ```bash
   psql -U <username> -f db_init.sql
   ```

2. Aggiorna il file `.env` nella cartella `backend`:
   ```
   DB_URL=postgres://<username>:<password>@localhost:5432/carbooking
   DB_NAME=carbooking
   DB_USER=<username>
   DB_PASSWORD=<password>
   DB_HOST=localhost
   DB_PORT=5432
   JWT_SECRET=12a4ea1e1d8470ad6bdfc844b55a3a1568de4b9dd7687dbd2ef8cbc0b9d304ce
   DB_SSL=false
   ```

3. Aggiorna il file `config.json` nella cartella `backend/config`:
   ```json
   {
     "development": {
       "username": "<username>",
       "password": "<password>",
       "database": "carbooking",
       "host": "localhost",
       "dialect": "postgres"
     },
     "test": {
       "username": "<username>",
       "password": "<password>",
       "database": "carbooking",
       "host": "localhost",
       "dialect": "postgres"
     },
     "production": {
       "username": "<username>",
       "password": "<password>",
       "database": "carbooking",
       "host": "localhost",
       "dialect": "postgres"
     }
   }
   ```

## Struttura del Database

Il database contiene le seguenti tabelle principali:

- **Users**: Utenti del sistema (clienti, officine, amministratori)
- **Anagrafica**: Dati anagrafici degli utenti
- **Servizi**: Servizi offerti dalle officine
- **Offerta**: Offerte pubblicate dalle officine
- **Calendario**: Disponibilità delle officine
- **Prenotazione**: Prenotazioni effettuate dai clienti
- **OfferteServizi**: Relazione tra offerte e servizi
- **PrenotazioneServizi**: Servizi inclusi nelle prenotazioni
- **Logs**: Log di sistema

## Query di Verifica

Lo script SQL include diverse query di verifica che puoi eseguire per controllare che tutto funzioni correttamente:

```bash
# Verifica utenti
psql -U <username> -d carbooking -c 'SELECT * FROM "Users";'

# Verifica servizi
psql -U <username> -d carbooking -c 'SELECT * FROM "Servizi";'

# Verifica offerte
psql -U <username> -d carbooking -c 'SELECT * FROM "Offerta";'

# Verifica relazioni offerte-servizi
psql -U <username> -d carbooking -c 'SELECT o."descrizione" AS offerta, s."nome" AS servizio, os."prezzo" FROM "Offerta" o JOIN "OfferteServizi" os ON o."id" = os."id_offerta" JOIN "Servizi" s ON s."id" = os."id_servizio";'
```

## Migrazione a un Database Remoto

Per migrare a un database remoto in futuro, sarà sufficiente aggiornare i file di configurazione con i nuovi parametri di connessione:

1. Aggiorna il file `.env` con il nuovo host:
   ```
   DB_HOST=<ip_remoto>
   ```

2. Aggiorna il file `config.json` con il nuovo host:
   ```json
   "host": "<ip_remoto>"
   ```

## Risoluzione dei Problemi

### Errore di Connessione

Se riscontri errori di connessione:

1. Verifica che PostgreSQL sia in esecuzione
2. Controlla le credenziali nel file `.env` e `config.json`
3. Assicurati che l'utente abbia i permessi necessari

### Errore durante la Creazione delle Tabelle

Se riscontri errori durante la creazione delle tabelle:

1. Verifica che il database `carbooking` non esista già
2. Controlla i log di PostgreSQL per errori specifici

### Errore durante l'Inserimento dei Dati

Se riscontri errori durante l'inserimento dei dati di esempio:

1. Verifica che le tabelle siano state create correttamente
2. Controlla i vincoli di integrità referenziale