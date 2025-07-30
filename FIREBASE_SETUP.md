# 🔥 Guida Setup Firebase - Vocabulary Master

## 📋 Stato Implementazione

✅ **IMPLEMENTATO:**
- Configurazione Firebase TypeScript
- Sistema di autenticazione completo
- Login con email/password
- Registrazione utenti
- Reset password
- **Login con Google** (popup + redirect fallback)
- Gestione sessioni utente
- Context providers type-safe
- Hook `useAuth` completo
- Componenti UI per auth (LoginForm, SignUpForm, ForgotPasswordForm)
- Integrazione con Firestore per profili utente
- Sistema di ruoli e permessi (user/admin)

## 🚀 Setup Rapido

### 1. Configura Firebase Console

1. **Crea progetto Firebase:**
   ```
   https://console.firebase.google.com
   → Aggiungi progetto
   → Nome: "vocabulary-master" (o a tua scelta)
   ```

2. **Abilita Authentication:**
   ```
   Authentication → Sign-in method → Abilita:
   ✅ Email/Password
   ✅ Google (opzionale ma consigliato)
   ```

3. **Abilita Firestore Database:**
   ```
   Firestore Database → Crea database
   → Modalità test (per sviluppo)
   → Posizione: europe-west3 (Europa)
   ```

4. **Ottieni configurazione app:**
   ```
   Impostazioni progetto (⚙️) → Le tue app
   → Aggiungi app web → Nome: "vocabulary-app"
   → Copia la configurazione
   ```

### 2. Configura Environment Variables

1. **Copia le credenziali:**
   - Apri il file `.env.local` (già creato)
   - Sostituisci i valori `your_*_here` con quelli reali da Firebase

2. **Configurazione minima richiesta:**
   ```env
   REACT_APP_FIREBASE_API_KEY=AIzaSy...
   REACT_APP_FIREBASE_AUTH_DOMAIN=tuo-progetto.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=tuo-progetto-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=tuo-progetto.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
   REACT_APP_FIREBASE_APP_ID=1:123:web:abc123
   ```

### 3. Installa dipendenze e avvia

```bash
# Installa dipendenze (se non già fatto)
npm install

# Avvia l'app
npm start
```

## 🔧 Funzionalità Disponibili

### Autenticazione
- ✅ **Registrazione**: Email, password, nome completo
- ✅ **Login**: Email/password + Google
- ✅ **Reset password**: Via email
- ✅ **Logout**: Completo con pulizia sessione
- ✅ **Persistenza**: Mantiene login tra sessioni

### Gestione Utenti
- ✅ **Profili utente**: Automaticamente creati in Firestore
- ✅ **Ruoli**: User/Admin con permessi specifici
- ✅ **Primo utente**: Diventa automaticamente admin
- ✅ **Metadati**: Tracking registrazione, ultimo login

### Sicurezza
- ✅ **Validazione forms**: Email, password, conferme
- ✅ **Error handling**: Messaggi user-friendly
- ✅ **Session validation**: Timeout per inattività
- ✅ **Type safety**: Tutto completamente tipizzato

## 🎯 Come Usare

### Nel codice:
```tsx
import { useAuth } from './hooks/integration/useAuth';

function MyComponent() {
  const {
    user,              // User entity con profilo completo
    isAuthenticated,   // Boolean
    signIn,           // Async function
    signInWithGoogle, // Async function  
    signOut,          // Async function
    isSigningIn,      // Loading state
    error,            // Error state
    isAdmin,          // User role check
  } = useAuth();

  // ... resto del componente
}
```

### Componenti pronti:
```tsx
import { AuthView } from './views/AuthView';

// Gestisce automaticamente login/signup/reset
<AuthView 
  onAuthSuccess={() => console.log('Login OK!')}
  initialMode="login" // "login" | "signup" | "forgot-password"
/>
```

## 🔄 Testing del Sistema

### 1. Test Registrazione
1. Vai alla pagina di registrazione
2. Compila: nome, email, password (min 6 caratteri)
3. Accetta termini
4. Click "Crea Account"
5. Verifica: utente creato in Firestore

### 2. Test Login Email
1. Vai alla pagina di login
2. Inserisci email/password
3. Click "Accedi"
4. Verifica: reindirizzamento e stato autenticato

### 3. Test Google Login
1. Vai alla pagina di login
2. Click "Continua con Google"
3. Completa il flusso Google
4. Verifica: profilo creato con dati Google

### 4. Test Reset Password
1. Vai alla pagina di login
2. Click "Password dimenticata?"
3. Inserisci email
4. Verifica: email ricevuta

## 🐛 Debugging

### Console Firebase
- Authentication → Users: vedi utenti registrati
- Firestore → Data: vedi profili utente
- Authentication → Settings → Authorized domains

### Browser Dev Tools
```javascript
// Debug auth state
console.log('Auth state:', firebase.auth().currentUser);

// Debug context
// In React DevTools, cerca FirebaseProvider e AuthContext
```

### Log nell'app
```typescript
// Abilita log di debug in .env.local
REACT_APP_DEBUG_LOGGING=true

// Vedrai log dettagliati nella console:
// 🔥 Firebase initialization...
// 🔐 [useAuth] Sign in attempt
// 🔐 [AuthService] Sign in successful
```

## 🚨 Problemi Comuni

### 1. "Firebase not ready"
- Verifica che tutte le env vars siano impostate
- Controlla console per errori Firebase init

### 2. "Popup blocked" per Google
- Il sistema fallback su redirect automaticamente
- Informa l'utente di abilitare popup

### 3. "Invalid configuration"
- Verifica Domain Authorization in Firebase Console
- Aggiungi localhost:3000 e il tuo dominio

### 4. Firestore permissions denied
- Cambia regole Firestore in modalità test:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2024, 12, 31);
    }
  }
}
```

## 📈 Prossimi Step

1. **Setup regole Firestore production**
2. **Implementa verifica email** (opzionale)
3. **Aggiungi 2FA** (opzionale)
4. **Deploy su hosting Firebase**

---

🎉 **Il sistema di autenticazione è completamente funzionale!** 

Hai solo bisogno di configurare Firebase Console e aggiungere le credenziali in `.env.local`.