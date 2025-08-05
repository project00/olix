#!/bin/bash

# Colori per i messaggi
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
NC="\033[0m" # No Color

echo -e "${YELLOW}Avvio del progetto Oil...${NC}"

# Avvio del container Docker
echo -e "${YELLOW}Avvio del container Docker...${NC}"
docker-compose up -d
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Errore nell'avvio del container Docker. Assicurati che Docker sia in esecuzione.${NC}"
  exit 1
fi
echo -e "${GREEN}Container Docker avviato con successo!${NC}"

# Attesa per l'inizializzazione del database
echo -e "${YELLOW}Attesa per l'inizializzazione del database (5 secondi)...${NC}"
sleep 5

# Esecuzione dello script di setup del database
echo -e "${YELLOW}Esecuzione dello script di setup del database...${NC}"
node setup_database.js
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Avvertimento: Lo script di setup del database ha restituito un errore, ma continueremo comunque.${NC}"
fi
echo -e "${GREEN}Setup del database completato!${NC}"

# Avvio del backend
echo -e "${YELLOW}Avvio del backend...${NC}"
cd Oil/backend
npm install &> /dev/null
npm run dev &
BACKEND_PID=$!
echo -e "${GREEN}Backend avviato con PID: $BACKEND_PID${NC}"
echo $BACKEND_PID > /tmp/oil_backend.pid
cd ../..

# Attesa per l'inizializzazione del backend
echo -e "${YELLOW}Attesa per l'inizializzazione del backend (5 secondi)...${NC}"
sleep 5

# Avvio del frontend
echo -e "${YELLOW}Avvio del frontend...${NC}"
cd Oil/frontend
npm install &> /dev/null
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend avviato con PID: $FRONTEND_PID${NC}"
echo $FRONTEND_PID > /tmp/oil_frontend.pid
cd ../..

echo -e "${GREEN}Progetto Oil avviato con successo!${NC}"
echo -e "${GREEN}Frontend disponibile su: http://localhost:5173${NC}"
echo -e "${GREEN}Backend disponibile su: http://localhost:8081${NC}"
echo -e "${YELLOW}Per arrestare il progetto, esegui ./stop_project.sh${NC}"