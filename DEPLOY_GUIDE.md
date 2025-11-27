# 🔥 Guida Deploy Firebase Cloud Functions

## Passo 1: Login a Firebase

1. **Apri PowerShell o CMD**
   - Premi `Windows + X` e seleziona "Windows PowerShell" o "Terminale"

2. **Esegui il comando di login:**
   ```powershell
   firebase login
   ```

3. **Segui le istruzioni:**
   - Si aprirà il browser
   - Accedi con il tuo account Google
   - Autorizza Firebase CLI

4. **Verifica il login:**
   ```powershell
   firebase projects:list
   ```
   Dovresti vedere il progetto `app-zerosei-pizza`

## Passo 2: Deploy delle Cloud Functions

1. **Vai nella cartella del progetto:**
   ```powershell
   cd "c:\Users\Andrea\Downloads\copy-of-app-timbrature-dipendenti-zerosei\app-zerosei-pizza"
   ```

2. **Esegui il deploy:**
   ```powershell
   firebase deploy --only functions
   ```

3. **Attendi il completamento** (può richiedere 2-3 minuti)

## Passo 3: Verifica

Dopo il deploy, vedrai gli URL delle funzioni:
- `getAccessToken`
- `getLoyaltyPoints`
- `syncCustomerData`

## ⚠️ Note Importanti

- Il deploy potrebbe richiedere l'abilitazione del **Billing** su Firebase
- Se richiesto, abilita il piano **Blaze** (pay-as-you-go)
- Le prime chiamate sono gratuite (quota generosa)

## 🆘 In Caso di Errori

**Errore: "Billing account not configured"**
- Vai su https://console.firebase.google.com/
- Seleziona il progetto `app-zerosei-pizza`
- Vai su "Settings" → "Usage and billing"
- Abilita il piano Blaze

**Errore: "Permission denied"**
- Assicurati di aver fatto il login con l'account corretto
- Verifica di avere i permessi di Owner/Editor sul progetto

---

**Fammi sapere quando hai completato il deploy!** 🚀
