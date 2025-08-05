#!/bin/bash

# Colori per i messaggi
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
NC="\033[0m" # No Color

echo -e "${YELLOW}Arresto del progetto Oil...${NC}"

# Arresto del frontend
echo -e "${YELLOW}Arresto del frontend...${NC}"
if [ -f /tmp/oil_frontend.pid ]; then
  FRONTEND_PID=$(cat /tmp/oil_frontend.pid)
  if ps -p $FRONTEND_PID > /dev/null; then
    kill $FRONTEND_PID
    echo -e "${GREEN}Frontend arrestato (PID: $FRONTEND_PID)${NC}"
  else
    echo -e "${YELLOW}Il processo del frontend non è in esecuzione${NC}"
  fi
  rm /tmp/oil_frontend.pid
else
  echo -e "${YELLOW}File PID del frontend non trovato${NC}"
  # Tentativo di trovare e arrestare il processo Vite
  VITE_PID=$(ps aux | grep "vite" | grep -v grep | awk '{print $2}')
  if [ ! -z "$VITE_PID" ]; then
    kill $VITE_PID
    echo -e "${GREEN}Frontend arrestato (PID: $VITE_PID)${NC}"
  fi
fi

# Arresto del backend
echo -e "${YELLOW}Arresto del backend...${NC}"
if [ -f /tmp/oil_backend.pid ]; then
  BACKEND_PID=$(cat /tmp/oil_backend.pid)
  if ps -p $BACKEND_PID > /dev/null; then
    kill $BACKEND_PID
    echo -e "${GREEN}Backend arrestato (PID: $BACKEND_PID)${NC}"
  else
    echo -e "${YELLOW}Il processo del backend non è in esecuzione${NC}"
  fi
  rm /tmp/oil_backend.pid
else
  echo -e "${YELLOW}File PID del backend non trovato${NC}"
  # Tentativo di trovare e arrestare il processo Node
  NODE_PID=$(ps aux | grep "node app.js" | grep -v grep | awk '{print $2}')
  if [ ! -z "$NODE_PID" ]; then
    kill $NODE_PID
    echo -e "${GREEN}Backend arrestato (PID: $NODE_PID)${NC}"
  fi
fi

# Arresto dei container Docker
echo -e "${YELLOW}Arresto dei container Docker...${NC}"
docker-compose down
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Errore nell'arresto dei container Docker${NC}"
else
  echo -e "${GREEN}Container Docker arrestati con successo${NC}"
fi

echo -e "${GREEN}Progetto Oil arrestato con successo!${NC}"