# Progetto Oil

## Script di gestione del progetto

Sono stati creati due script per semplificare la gestione del progetto:

### Script di avvio

Per avviare tutti i componenti del progetto (database, backend e frontend), eseguire:

```bash
./start_project.sh
```

Questo script eseguirà le seguenti operazioni:
1. Avvio del container Docker con PostgreSQL e PostGIS
2. Esecuzione dello script di setup del database
3. Avvio del backend Node.js
4. Avvio del frontend Vite/React

Al termine dell'esecuzione, il progetto sarà disponibile ai seguenti indirizzi:
- Frontend: http://localhost:5173
- Backend: http://localhost:8081

### Script di arresto

Per arrestare tutti i componenti del progetto, eseguire:

```bash
./stop_project.sh
```

Questo script eseguirà le seguenti operazioni:
1. Arresto del frontend
2. Arresto del backend
3. Arresto e rimozione dei container Docker

## Note

- Gli script salvano i PID dei processi in file temporanei per facilitare l'arresto
- In caso di problemi con l'arresto dei processi, gli script tenteranno di identificare i processi tramite i comandi `ps` e `grep`
- È necessario avere Docker e Docker Compose installati e funzionanti per utilizzare questi script