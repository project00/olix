# Documentazione Tecnica: Modulo 2 - Autenticazione

## 1. Scopo del Modulo

Il modulo di **Autenticazione** è responsabile della gestione degli accessi utente al sistema. Fornisce le funzionalità di registrazione di nuovi utenti e di login per gli utenti esistenti. L'autenticazione si basa su token web JSON (JWT), che vengono generati al momento del login e utilizzati per proteggere le API riservate.

## 2. Componenti Principali

- **Modello:** `models/user.js` (Modello Sequelize per l'entità `User`)
- **Controller:** `controllers/authController.js` (Logica per la registrazione e il login)
- **Route:** `routes/auth.js` (Definizione degli endpoint API)
- **Middleware di Protezione:** `middlewares/auth.middleware.js` (Middleware `protect` per verificare i token JWT)

## 3. API Endpoints

### 3.1. Registrazione Utente

Registra un nuovo utente nel sistema.

- **Endpoint:** `POST /api/auth/register`
- **Content-Type:** `application/json`

#### Request Body

```json
{
  "email": "nuovoutente@example.com",
  "password": "passwordSicura123"
}
```

- `email` (string, required): L'indirizzo email univoco dell'utente. Deve essere un formato email valido.
- `password` (string, required): La password dell'utente. Deve avere una lunghezza minima di 6 caratteri.

#### Success Response (201 Created)

Alla registrazione avvenuta con successo, l'API restituisce un token JWT.

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVJZCI6MiwiZW1haWwiOiJudW92b3V0ZW50ZUBleGFtcGxlLmNvbSIsImlhdCI6MTY3ODg4NjAwMCwiZXhwIjoxNjc4ODg5NjAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
}
```

#### Error Responses

- **400 Bad Request:** Se i dati forniti non sono validi (es. email non valida, password troppo corta).

  ```json
  {
    "errors": [
      {
        "type": "field",
        "msg": "Password must be 6 or more characters",
        "path": "password",
        "location": "body"
      }
    ]
  }
  ```

- **400 Bad Request:** Se un utente con la stessa email esiste già.

  ```json
  {
    "error": "User with this email already exists."
  }
  ```

### 3.2. Login Utente

Autentica un utente esistente e restituisce un token JWT.

- **Endpoint:** `POST /api/auth/login`
- **Content-Type:** `application/json`

#### Request Body

```json
{
  "email": "utenteregistrato@example.com",
  "password": "passwordCorretta123"
}
```

#### Success Response (200 OK)

In caso di successo, l'API restituisce un nuovo token JWT.

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInJvbGVJZCI6MiwiZW1haWwiOiJ1dGVudGVyZWdpc3RyYXRvQGV4YW1wbGUuY29tIiwiaWF0IjoxNjc4ODg2MDYwLCJleHAiOjE2Nzg4ODk2NjB9.dG9rZW5fYWx0cm9fY2FzbyAK"
}
```

#### Error Responses

- **401 Unauthorized:** Se le credenziali (email o password) non sono corrette o l'utente non esiste.

  ```json
  {
    "error": "Invalid credentials."
  }
  ```

## 4. Protezione delle Route (Middleware)

Per proteggere le route che richiedono un utente autenticato, è stato creato il middleware `protect` in `middlewares/auth.middleware.js`.

**Utilizzo:**

Per proteggere una route, aggiungere il middleware prima della funzione del controller.

```javascript
// Esempio in un file di route
const express = require('express');
const router = express.Router();
const { getMyProfile } = require('../controllers/userController');
const { protect } = require('../middlewares/auth.middleware');

// Questa route è protetta.
// Richiede un header 'Authorization: Bearer <token>'
router.get('/me', protect, getMyProfile);
```

Il middleware verifica la validità del token JWT e, in caso di successo, aggiunge l'oggetto `user` alla richiesta (`req.user`) per un uso successivo nel controller.
