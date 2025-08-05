-- Estensione PostGIS per geolocalizzazione avanzata
CREATE EXTENSION IF NOT EXISTS postgis;

-- Tabella Ruoli per gestione multi-livello
CREATE TABLE "Ruoli" (
  "id" SERIAL PRIMARY KEY,
  "nome" VARCHAR(20) NOT NULL UNIQUE,
  "livello" INTEGER NOT NULL UNIQUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "Ruoli" ("nome", "livello") VALUES
  ('Cliente', 0),
  ('Officina', 1),
  ('Admin', 2),
  ('Assistenza', 3),
  ('SuperAdmin', 4);

-- Tabella Users con ruoli normalizzati
CREATE TABLE "Users" (
  "id" SERIAL PRIMARY KEY,
  "user" VARCHAR(255) NOT NULL UNIQUE,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "psw" VARCHAR(256) NOT NULL,
  "token" VARCHAR(256),
  "active" BOOLEAN DEFAULT TRUE,
  "role_id" INTEGER NOT NULL REFERENCES "Ruoli"("livello") DEFAULT 0,
  "officina_id" INTEGER, -- Per multi-tenancy
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabelle per la gestione dei veicoli
CREATE TABLE "Marche" (
  "id" SERIAL PRIMARY KEY,
  "nome" VARCHAR(50) NOT NULL UNIQUE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Modelli" (
  "id" SERIAL PRIMARY KEY,
  "marca_id" INTEGER NOT NULL REFERENCES "Marche"("id"),
  "nome" VARCHAR(50) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("marca_id", "nome")
);

-- Tabella per gestione criteri veicolo flessibile
CREATE TABLE "CriteriVeicolo" (
  "id" SERIAL PRIMARY KEY,
  "nome" VARCHAR(50) NOT NULL UNIQUE, -- es: 'anno_min', 'cilindrata_max'
  "tipo_dato" VARCHAR(20) NOT NULL, -- 'integer', 'float', 'boolean'
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserimento criteri predefiniti
INSERT INTO "CriteriVeicolo" ("nome", "tipo_dato") VALUES
  ('marca_id', 'integer'),
  ('modello_id', 'integer'),
  ('anno_min', 'integer'),
  ('anno_max', 'integer'),
  ('cilindrata_min', 'float'),
  ('cilindrata_max', 'float'),
  ('km_min', 'integer'),
  ('km_max', 'integer'),
  ('carburante', 'varchar');

-- Tabella Anagrafica con geolocalizzazione
CREATE TABLE "Anagrafica" (
  "id" SERIAL PRIMARY KEY,
  -- Dati identificativi
  "ragione_sociale" VARCHAR(255),
  "cognome" VARCHAR(255),
  "nome" VARCHAR(255),
  
  -- Indirizzo
  "indirizzo" VARCHAR(255) NOT NULL,
  "citta" VARCHAR(255) NOT NULL,
  "provincia" VARCHAR(2) NOT NULL,
  "cap" VARCHAR(5) NOT NULL,
  "latitudine" FLOAT NOT NULL,
  "longitudine" FLOAT NOT NULL,
  "geopoint" GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitudine, latitudine), 4326)
  ) STORED,
  
  -- Dati fiscali
  "piva" VARCHAR(11) UNIQUE,
  "email" VARCHAR(255) NOT NULL,
  
  -- Metadata
  "usrlogin" INTEGER REFERENCES "Users"("id"),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Servizi con storico prezzi
CREATE TABLE "Servizi" (
  "id" SERIAL PRIMARY KEY,
  "nome" VARCHAR(255) NOT NULL,
  "descrizione" TEXT,
  "durata" INTEGER DEFAULT 60 NOT NULL,
  "attivo" BOOLEAN DEFAULT TRUE,
  "costo_base" FLOAT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella per storico prezzi servizi
CREATE TABLE "StoricoPrezziServizi" (
  "id" SERIAL PRIMARY KEY,
  "servizio_id" INTEGER NOT NULL REFERENCES "Servizi"("id"),
  "prezzo" FLOAT NOT NULL,
  "valido_dal" DATE NOT NULL,
  "valido_al" DATE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Offerta con sistema di versioning
CREATE TABLE "Offerta" (
  "id" SERIAL PRIMARY KEY,
  "nome" VARCHAR(255) NOT NULL,
  "descrizione" TEXT,
  "version" INTEGER DEFAULT 1 NOT NULL,
  "officina" INTEGER NOT NULL REFERENCES "Anagrafica"("id"),
  "priorita" INTEGER DEFAULT 0 NOT NULL,
  "attiva" BOOLEAN DEFAULT TRUE NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella per criteri applicabilità offerta (flessibile)
CREATE TABLE "OffertaCriteri" (
  "offerta_id" INTEGER NOT NULL REFERENCES "Offerta"("id") ON DELETE CASCADE,
  "criterio_id" INTEGER NOT NULL REFERENCES "CriteriVeicolo"("id"),
  "valore" TEXT NOT NULL, -- Valore flessibile (può essere numero, stringa, ecc.)
  "operatore" VARCHAR(10) DEFAULT '=' NOT NULL, -- =, <, >, <=, >=, BETWEEN
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("offerta_id", "criterio_id")
);

-- Tabella per validità temporale offerta
CREATE TABLE "OffertaValidita" (
  "id" SERIAL PRIMARY KEY,
  "offerta_id" INTEGER NOT NULL REFERENCES "Offerta"("id") ON DELETE CASCADE,
  "valido_dal" TIMESTAMP NOT NULL,
  "valido_al" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK ("valido_dal" < "valido_al")
);

-- Tabella composizione offerta
CREATE TABLE "OffertaServizi" (
  "id" SERIAL PRIMARY KEY,
  "offerta_id" INTEGER NOT NULL REFERENCES "Offerta"("id") ON DELETE CASCADE,
  "servizio_id" INTEGER NOT NULL REFERENCES "Servizi"("id"),
  "prezzo_fisso" FLOAT, -- Prezzo bloccato per l'offerta
  "sconto_percentuale" FLOAT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Calendario con controllo conflitti
CREATE TABLE "Calendario" (
  "id" SERIAL PRIMARY KEY,
  "id_offerta" INTEGER NOT NULL REFERENCES "Offerta"("id"),
  "data_inizio" TIMESTAMP NOT NULL,
  "data_fine" TIMESTAMP NOT NULL,
  "max_prenotazioni" INTEGER DEFAULT 1,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  EXCLUDE USING gist (
    "id_offerta" WITH =,
    tstzrange("data_inizio", "data_fine") WITH &&
  )
);

-- Tabella Prenotazione con storico prezzi
CREATE TABLE "Prenotazione" (
  "id" SERIAL PRIMARY KEY,
  "uuid" UUID DEFAULT gen_random_uuid() UNIQUE,
  "user_id" INTEGER NOT NULL REFERENCES "Users"("id"),
  "id_offerta" INTEGER NOT NULL REFERENCES "Offerta"("id"),
  "veicolo_info" JSONB NOT NULL, -- Dettagli veicolo al momento della prenotazione
  "stato" VARCHAR(20) DEFAULT 'pending' CHECK ("stato" IN ('pending', 'confirmed', 'completed', 'cancelled')),
  "costo_totale" FLOAT NOT NULL,
  "distanza_km" FLOAT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella dettaglio servizi prenotazione
CREATE TABLE "PrenotazioneServizi" (
  "prenotazione_id" INTEGER NOT NULL REFERENCES "Prenotazione"("id") ON DELETE CASCADE,
  "servizio_id" INTEGER NOT NULL REFERENCES "Servizi"("id"),
  "prezzo_effettivo" FLOAT NOT NULL, -- Prezzo applicato al momento
  "quantita" INTEGER DEFAULT 1 NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("prenotazione_id", "servizio_id")
);

-- Tabella Logs con classificazione
CREATE TABLE "Logs" (
  "id" SERIAL PRIMARY KEY,
  "livello" VARCHAR(20) NOT NULL CHECK ("livello" IN ('debug', 'info', 'warning', 'error', 'critical')),
  "messaggio" TEXT NOT NULL,
  "tipo" VARCHAR(50) NOT NULL, -- 'prenotazione', 'offerta', 'sistema'
  "dettagli" JSONB,
  "user_id" INTEGER REFERENCES "Users"("id"),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indici per performance
CREATE INDEX idx_anagrafica_geopoint ON "Anagrafica" USING GIST ("geopoint");
CREATE INDEX idx_calendario_dates ON "Calendario" USING GIST (tstzrange("data_inizio", "data_fine"));
CREATE INDEX idx_offertacriteri_valore ON "OffertaCriteri" ("criterio_id", "valore");
CREATE INDEX idx_prenotazione_veicolo_info ON "Prenotazione" USING GIN ("veicolo_info");
CREATE INDEX idx_logs_tipo_livello ON "Logs" ("tipo", "livello", "createdAt");

-- Funzione per disattivare offerte scadute
CREATE OR REPLACE FUNCTION disattiva_offerte_scadute()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "Offerta" o
  SET "attiva" = FALSE
  FROM "OffertaValidita" ov
  WHERE 
    o.id = ov.offerta_id AND
    ov.valido_al < NOW() AND
    o.attiva = TRUE;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger per disattivazione automatica
CREATE TRIGGER trigger_disattiva_offerte
AFTER INSERT OR UPDATE ON "OffertaValidita"
EXECUTE FUNCTION disattiva_offerte_scadute();

-- Vista per offerte attive
CREATE VIEW "OfferteAttive" AS
SELECT 
  o.*,
  ov.valido_dal,
  ov.valido_al
FROM "Offerta" o
JOIN "OffertaValidita" ov ON o.id = ov.offerta_id
WHERE 
  o.attiva = TRUE AND
  NOW() BETWEEN ov.valido_dal AND ov.valido_al;

-- Funzione per calcolo prezzo servizio
CREATE OR REPLACE FUNCTION get_prezzo_servizio(servizio_id INT, data_rif TIMESTAMP)
RETURNS FLOAT AS $$
DECLARE
  prezzo FLOAT;
BEGIN
  SELECT prezzo INTO prezzo
  FROM "StoricoPrezziServizi"
  WHERE 
    servizio_id = get_prezzo_servizio.servizio_id AND
    valido_dal <= data_rif AND
    (valido_al IS NULL OR valido_al >= data_rif)
  ORDER BY valido_dal DESC
  LIMIT 1;

  IF NOT FOUND THEN
    SELECT costo_base INTO prezzo
    FROM "Servizi"
    WHERE id = servizio_id;
  END IF;

  RETURN prezzo;
END;
$$ LANGUAGE plpgsql;

-- Politica di sicurezza per multi-tenancy
ALTER TABLE "Offerta" ENABLE ROW LEVEL SECURITY;
CREATE POLICY officina_policy ON "Offerta"
  USING (officina = current_setting('app.current_officina_id')::INT);

-- Inserimento dati dimostrativi
INSERT INTO "Users" ("user", "email", "psw", "role_id") VALUES 
  ('officina_milano', 'officina@example.com', crypt('securepass', gen_salt('bf')), 1),
  ('cliente1', 'cliente@example.com', crypt('clientpass', gen_salt('bf')), 0);

INSERT INTO "Anagrafica" (
  "ragione_sociale", "indirizzo", "citta", "provincia", "cap", 
  "latitudine", "longitudine", "piva", "email", "usrlogin"
) VALUES (
  'AutoService Milano', 'Via Roma 1', 'Milano', 'MI', '20100',
  45.4642, 9.1900, '12345678901', 'info@autoservice.it', 1
);

INSERT INTO "Marche" ("nome") VALUES ('Fiat'), ('Ford');
INSERT INTO "Modelli" ("marca_id", "nome") VALUES (1, 'Panda'), (2, 'Focus');

INSERT INTO "Servizi" ("nome", "descrizione", "durata", "costo_base") VALUES
  ('Cambio Olio', 'Sostituzione olio motore', 30, 49.90),
  ('Tagliando completo', 'Controllo generale veicolo', 120, 129.90);

-- Creazione offerta con sistema flessibile
INSERT INTO "Offerta" ("nome", "descrizione", "officina", "priorita") VALUES
  ('Promozione Estate 2023', 'Special tagliando estate', 1, 1);

INSERT INTO "OffertaValidita" ("offerta_id", "valido_dal", "valido_al") VALUES
  (1, '2023-06-01', '2023-09-30');

INSERT INTO "OffertaCriteri" ("offerta_id", "criterio_id", "valore", "operatore") VALUES
  (1, (SELECT id FROM "CriteriVeicolo" WHERE nome = 'anno_min'), '2010', '>='),
  (1, (SELECT id FROM "CriteriVeicolo" WHERE nome = 'cilindrata_max'), '2000', '<='),
  (1, (SELECT id FROM "CriteriVeicolo" WHERE nome = 'marca_id'), '1', '=');

INSERT INTO "OffertaServizi" ("offerta_id", "servizio_id", "sconto_percentuale") VALUES
  (1, 1, 10.0),
  (1, 2, 15.0);

-- Prenotazione con storico prezzi
INSERT INTO "Prenotazione" (
  "user_id", "id_offerta", "veicolo_info", "costo_totale"
) VALUES (
  2,
  1,
  '{"marca": "Fiat", "modello": "Panda", "anno": 2015, "cilindrata": 1200}'::JSONB,
  150.00
);

INSERT INTO "PrenotazioneServizi" ("prenotazione_id", "servizio_id", "prezzo_effettivo") VALUES
  (1, 1, 44.91),
  (1, 2, 110.39);

-- Query per ricerca offerte (esempio)
SELECT o.nome, o.descrizione, a.ragione_sociale AS officina,
  ST_Distance(a.geopoint, ST_SetSRID(ST_MakePoint(9.18, 45.47), 4326)::geography) / 1000 AS distanza_km
FROM "OfferteAttive" o
JOIN "Anagrafica" a ON o.officina_id = a.id
JOIN "OffertaCriteri" oc ON o.id = oc.offerta_id
WHERE 
  oc.criterio_id = (SELECT id FROM "CriteriVeicolo" WHERE nome = 'marca_id') AND
  oc.valore = '1' AND
  oc.operatore = '=' AND
  ST_DWithin(
    a.geopoint,
    ST_SetSRID(ST_MakePoint(9.18, 45.47), 4326)::geography,
    50 * 1000 -- 50 km
  );