// Script Node.js per l'inizializzazione del database PostgreSQL
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Crea un'interfaccia readline per l'input dell'utente
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colori per l'output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

// Funzione per stampare messaggi colorati
function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Funzione per verificare se il container Docker PostgreSQL è in esecuzione
function checkDockerContainer() {
  try {
    // Verifica se il container è raggiungibile
    execSync('pg_isready -h postgres -p 5432', { stdio: 'ignore' });
    return true;
  } catch (error) {
    try {
      // Prova con localhost se 'postgres' non funziona
      execSync('pg_isready -h localhost -p 5433', { stdio: 'ignore' });
      // Se funziona con localhost, aggiorna le variabili globali
      print('Container PostgreSQL trovato su localhost:5433', 'green');
      return 'localhost';
    } catch (err) {
      return false;
    }
  }
}

// Funzione principale
async function setupDatabase() {
  print('=== Inizializzazione Database OilX ===', 'yellow');
  print('Utilizzo container Docker PostgreSQL con database carbooking', 'yellow');

  // Verifica che PostgreSQL sia installato
  try {
    execSync('psql --version', { stdio: 'ignore' });
  } catch (error) {
    print('PostgreSQL non è installato. Installalo prima di continuare.', 'red');
    process.exit(1);
  }
  
  // Verifica che il container Docker sia in esecuzione
  const dockerStatus = checkDockerContainer();
  if (dockerStatus === false) {
    print('Il container Docker PostgreSQL non è in esecuzione. Avvialo prima di continuare.', 'red');
    print('Puoi avviarlo con: docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres', 'yellow');
    process.exit(1);
  }
  
  // Imposta l'host corretto
  const dbHost = dockerStatus === true ? 'postgres' : 'localhost';

  // Utilizza le credenziali del container Docker
  // Queste credenziali sono definite nel docker-compose.yml
  const pgUser = 'user';
  const pgPassword = 'password';
  const dbPort = dbHost === 'localhost' ? 5433 : 5432;

  // Crea il database e le tabelle
  print('Creazione del database e delle tabelle...', 'yellow');
  try {
    const sqlFilePath = path.join(__dirname, 'Oil', 'db_init.sql');
    const env = { ...process.env, PGPASSWORD: pgPassword };
    // Connessione al database carbooking per eseguire lo script
    const dbPort = dbHost === 'localhost' ? 5433 : 5432;
    execSync(`psql -U ${pgUser} -h ${dbHost} -p ${dbPort} -d carbooking -f "${sqlFilePath}"`, { env });
    print('Database inizializzato con successo!', 'green');

    // Aggiorna il file .env
    print('Aggiornamento configurazione nel file .env...', 'yellow');
    const envPath = path.join(__dirname, 'Oil', 'backend', '.env');
    
    // Backup del file .env originale
    if (fs.existsSync(envPath)) {
      fs.copyFileSync(envPath, `${envPath}.backup`);
      print('Backup del file .env originale creato in backend/.env.backup', 'yellow');
    }

    // Crea o aggiorna il file .env
  const envContent = `DB_URL=postgres://${pgUser}:${pgPassword}@${dbHost}:${dbPort}/carbooking
DB_NAME=carbooking
DB_USER=${pgUser}
DB_PASSWORD=${pgPassword}
DB_HOST=${dbHost}
DB_PORT=${dbPort}
JWT_SECRET=12a4ea1e1d8470ad6bdfc844b55a3a1568de4b9dd7687dbd2ef8cbc0b9d304ce
DB_SSL=false
`;
    
    fs.writeFileSync(envPath, envContent);
    print('File .env aggiornato con successo!', 'green');

    // Aggiorna il file config.json
    print('Aggiornamento file config.json...', 'yellow');
    const configPath = path.join(__dirname, 'Oil', 'backend', 'config', 'config.json');
    
    // Backup del file config.json originale
    if (fs.existsSync(configPath)) {
      fs.copyFileSync(configPath, `${configPath}.backup`);
      print('Backup del file config.json originale creato in backend/config/config.json.backup', 'yellow');
    }

    // Crea o aggiorna il file config.json
  const configContent = {
      development: {
        username: pgUser,
        password: pgPassword,
        database: 'carbooking',
        host: dbHost,
        port: dbPort,
        dialect: 'postgres'
      },
      test: {
        username: pgUser,
        password: pgPassword,
        database: 'carbooking',
        host: dbHost,
        port: dbPort,
        dialect: 'postgres'
      },
      production: {
        username: pgUser,
        password: pgPassword,
        database: 'carbooking',
        host: dbHost,
        port: dbPort,
        dialect: 'postgres'
      }
    };

    fs.writeFileSync(configPath, JSON.stringify(configContent, null, 2));
    print('File config.json aggiornato con successo!', 'green');

    print('\n=== Configurazione completata! ===', 'green');
    print(`Puoi avviare il backend con: ${colors.yellow}cd Oil/backend && npm run dev${colors.reset}`);
    print(`Puoi avviare il frontend con: ${colors.yellow}cd Oil/frontend && npm run dev${colors.reset}`);

    // Esegui alcune query di verifica
    print('\nEsecuzione query di verifica...', 'yellow');
    print('Verifica utenti:', 'yellow');
    execSync(`psql -U ${pgUser} -h ${dbHost} -p ${dbPort} -d carbooking -c "SELECT * FROM \"Users\";"`); 
    
    print('\nVerifica servizi:', 'yellow');
    execSync(`psql -U ${pgUser} -h ${dbHost} -p ${dbPort} -d carbooking -c "SELECT * FROM \"Servizi\";"`); 
    
    print('\nVerifica offerte:', 'yellow');
    execSync(`psql -U ${pgUser} -h ${dbHost} -p ${dbPort} -d carbooking -c "SELECT * FROM \"Offerta\";"`);  
    
    print('\nVerifica completata!', 'green');

  } catch (error) {
    print(`Si è verificato un errore durante l'inizializzazione del database: ${error.message}`, 'red');
    print('\nPossibili soluzioni:', 'yellow');
    print('1. Verifica che il container Docker sia in esecuzione con: docker ps', 'yellow');
    print('2. Verifica che le credenziali siano corrette (user/password)', 'yellow');
    print('3. Verifica che il database carbooking esista nel container', 'yellow');
    print('4. Se necessario, ricrea il container con: docker-compose up -d', 'yellow');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Esegui la funzione principale
setupDatabase();