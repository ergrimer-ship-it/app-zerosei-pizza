# Firebase Cloud Functions - Cassanova API Proxy

Queste Cloud Functions agiscono come proxy per l'API di Cassanova, risolvendo i problemi CORS.

## Funzioni Disponibili

### 1. `getAccessToken`
Ottiene un access token OAuth2 da Cassanova.

**Parametri:**
- `apiKey` (string): La chiave API di Cassanova

**Risposta:**
```json
{
  "success": true,
  "accessToken": "...",
  "expiresIn": 3600
}
```

### 2. `getLoyaltyPoints`
Recupera i punti fedeltà di un cliente.

**Parametri:**
- `accessToken` (string): Access token OAuth2
- `customerId` (string): ID del cliente

**Risposta:**
```json
{
  "success": true,
  "customerId": "...",
  "points": 150,
  "tier": "Gold",
  "lastUpdated": "2025-11-26T..."
}
```

### 3. `syncCustomerData`
Sincronizza i dati del cliente con Cassanova.

**Parametri:**
- `accessToken` (string): Access token OAuth2
- `customerData` (object): Dati del cliente

**Risposta:**
```json
{
  "success": true,
  "message": "Customer data synced successfully"
}
```

## Deployment

### Prerequisiti
1. Installa Firebase CLI: `npm install -g firebase-tools`
2. Login a Firebase: `firebase login`

### Deploy
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

## Test Locale
```bash
cd functions
npm run serve
```

Questo avvierà l'emulatore locale su `http://localhost:5001`
