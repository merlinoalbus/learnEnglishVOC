# =====================================================
# 📁 scripts/wrapper.ps1 - WRAPPER ORCHESTRATOR DOCUMENTATO COMPLETO
# =====================================================

<#
**SCOPO DELLO SCRIPT:**
Questo script PowerShell è un "orchestrator" che coordina l'estrazione del codice 
da un progetto React in modo organizzato. Invece di estrarre tutto in un file gigante,
divide il progetto in sezioni logiche creando file separati per ogni area.

**PERCHÉ È UTILE:**
- Organizza il codice per tipologia (views, hooks, components, etc.)
- Crea file di dimensioni gestibili per analisi
- Evita l'overload di un singolo file enorme
- Facilita l'analisi mirata di specifiche parti del progetto
- Ottimale per AI analysis che hanno limiti sui token

**QUANDO USARLO:**
- Prima di analizzare un progetto React con AI/ChatGPT
- Per documentazione organizzata del codebase
- Per code review strutturate
- Quando hai bisogno di overview per sezioni

**COME FUNZIONA:**
1. Definisce la struttura organizzativa del progetto
2. Crea una cartella di output pulita
3. Chiama extract.ps1 multiple volte con parametri diversi
4. Genera file separati per ogni sezione del progetto
5. Mantiene la root separata dalle cartelle specifiche

**OUTPUT PRODOTTO:**
- root.txt: File root, configurazione, Docker, package.json
- views.txt: Tutte le pagine/schermate React
- hooks.txt: Custom hooks e logica riutilizzabile
- contexts.txt: Context API e state management
- components.txt: Componenti UI riutilizzabili
- services.txt: Servizi API e business logic
- utils.txt: Utility functions e helpers
- constants.txt: Costanti e configurazioni
- layouts.txt: Layout components e strutture
#>

# =====================================================
# CONFIGURAZIONE PERCORSI
# =====================================================

# **CARTELLA OUTPUT:**
# Definisce dove salvare tutti i file estratti
# ".\..\config_txt" significa "vai su di una cartella e poi entra in config_txt"
$configFolder = ".\..\config_txt"

# **PERCORSI SPECIFICI DA GESTIRE SEPARATAMENTE:**
# Array di cartelle che verranno processate individualmente
# Ogni cartella diventerà un file .txt separato
$specificPaths = @(
    "..\src\views",      # Pagine/schermate dell'app (MainView, TestView, etc.)
    "..\src\utils",      # Funzioni utility generiche
    "..\src\services",   # Servizi per API calls e business logic
    "..\src\layouts",    # Layout components (AppLayout, etc.)
    "..\src\hooks",      # Custom React hooks
    "..\src\contexts",   # React Context providers
    "..\src\constants",  # Costanti e configurazioni
    "..\src\components"  # Componenti UI riutilizzabili
)

# =====================================================
# PREPARAZIONE AMBIENTE
# =====================================================

# **CREAZIONE CARTELLA OUTPUT:**
# Test-Path controlla se la cartella esiste
# -PathType Container = specifica che stiamo cercando una cartella (non un file)
if (-not (Test-Path -Path $configFolder -PathType Container)) {
    # New-Item crea una nuova cartella
    # -ItemType Directory = specifica che stiamo creando una cartella
    New-Item -Path $configFolder -ItemType Directory
    Write-Host "Cartella output creata: $configFolder" -ForegroundColor Green
} else {
    Write-Host "Cartella output già esistente: $configFolder" -ForegroundColor Yellow
}

# **PULIZIA FILE PRECEDENTI:**
# Remove-Item elimina tutti i file .txt dalla cartella di output
# -Path "$configFolder\*.txt" = pattern che matcha tutti i .txt nella cartella
# -ErrorAction SilentlyContinue = non mostrare errori se non ci sono file da eliminare
Remove-Item -Path "$configFolder\*.txt" -ErrorAction SilentlyContinue
Write-Host "File .txt precedenti rimossi dalla cartella output" -ForegroundColor Cyan

# =====================================================
# ESTRAZIONE ROOT (TUTTO TRANNE CARTELLE SPECIFICHE)
# =====================================================

Write-Host "`n🚀 FASE 1: Estrazione ROOT (configurazione, Docker, package.json, etc.)" -ForegroundColor Magenta

<#
**ESTRAZIONE ROOT:**
Questa chiamata estrae tutto dalla cartella principale DEL PROGETTO, 
MA salta le cartelle specifiche che processeremo separatamente.

PARAMETRI SPIEGATI:
- SourcePath ".\..\" = vai su una cartella (dalla cartella scripts alla root del progetto)
- OutputFile "$configFolder\root.txt" = salva in config_txt/root.txt
- PathsToSkip $specificPaths = salta le cartelle nell'array $specificPaths

COSA INCLUDE ROOT.TXT:
- package.json, package-lock.json (dipendenze e metadati)
- Dockerfile, docker-compose.yml (configurazione container)
- File .env.example, .gitignore (configurazione ambiente)
- File in src\ che NON sono nelle cartelle specifiche
- Script in scripts\ (incluso questo file!)
- File di configurazione vari (.eslintrc, etc.)
#>
.\extract.ps1 -SourcePath ".\..\" -OutputFile "$configFolder\root.txt" -PathsToSkip $specificPaths

Write-Host "✅ ROOT extraction completata → root.txt" -ForegroundColor Green

# =====================================================
# ESTRAZIONI SPECIFICHE PER CARTELLA
# =====================================================

Write-Host "`n🎯 FASE 2: Estrazioni specifiche per tipologia" -ForegroundColor Magenta

<#
**ESTRAZIONI MIRATE:**
Ogni chiamata a extract.ps1 qui sotto processa UNA SOLA cartella specifica,
creando un file dedicato per quella tipologia di codice.

VANTAGGI APPROCCIO:
1. **Organizzazione:** Ogni file contiene codice correlato
2. **Dimensioni gestibili:** File più piccoli e focalizzati  
3. **Analisi mirata:** Puoi analizzare solo la parte che ti interessa
4. **Parallelizzazione:** Potresti processare più file contemporaneamente
5. **Debug:** Più facile trovare problemi in sezioni specifiche
#>

# **VIEWS (Pagine/Schermate):**
Write-Host "📱 Estraendo VIEWS..." -ForegroundColor Blue
.\extract.ps1 -SourcePath ".\..\src\views" -OutputFile "$configFolder\views.txt"
Write-Host "✅ VIEWS extraction completata → views.txt" -ForegroundColor Green

<#
VIEWS CONTIENE:
- MainView.js (pagina principale con lista parole)
- TestView.js (pagina quiz interattivo)
- ResultsView.js (pagina risultati test)
- StatsView.js (pagina statistiche e dashboard)
#>

# **UTILS (Utilities):**
Write-Host "🔧 Estraendo UTILS..." -ForegroundColor Blue
.\extract.ps1 -SourcePath ".\..\src\utils" -OutputFile "$configFolder\utils.txt"
Write-Host "✅ UTILS extraction completata → utils.txt" -ForegroundColor Green

<#
UTILS CONTIENE:
- formatUtils.js (funzioni per formattare note e risultati)
- validationUtils.js (validazione input)
- dateUtils.js (gestione date e timestamp)
- storageUtils.js (helpers per localStorage)
#>

# **SERVICES (Servizi API):**
Write-Host "🌐 Estraendo SERVICES..." -ForegroundColor Blue
.\extract.ps1 -SourcePath ".\..\src\services" -OutputFile "$configFolder\services.txt"
Write-Host "✅ SERVICES extraction completata → services.txt" -ForegroundColor Green

<#
SERVICES CONTIENE:
- aiService.js (integrazione Gemini AI per analisi parole)
- apiService.js (chiamate API generiche)
- errorService.js (gestione errori centralizzata)
- cacheService.js (caching delle risposte AI)
#>

# **LAYOUTS (Strutture Layout):**
Write-Host "🏗️ Estraendo LAYOUTS..." -ForegroundColor Blue
.\extract.ps1 -SourcePath ".\..\src\layouts" -OutputFile "$configFolder\layouts.txt"
Write-Host "✅ LAYOUTS extraction completata → layouts.txt" -ForegroundColor Green

<#
LAYOUTS CONTIENE:
- AppLayout.js (layout principale con header e navigation)
- TestLayout.js (layout specifico per quiz)
- StatisticsLayout.js (layout per pagine statistiche)
#>

# **HOOKS (Custom Hooks):**
Write-Host "🪝 Estraendo HOOKS..." -ForegroundColor Blue
.\extract.ps1 -SourcePath ".\..\src\hooks" -OutputFile "$configFolder\hooks.txt"
Write-Host "✅ HOOKS extraction completata → hooks.txt" -ForegroundColor Green

<#
HOOKS CONTIENE:
- useOptimizedWords.js (gestione parole con localStorage)
- useOptimizedTest.js (logica quiz e test)
- useEnhancedStats.js (statistiche avanzate)
- useLocalStorage.js (hook per persistenza dati)
- useNotification.js (sistema notifiche)
#>

# **CONTEXTS (State Management):**
Write-Host "🌍 Estraendo CONTEXTS..." -ForegroundColor Blue
.\extract.ps1 -SourcePath ".\..\src\contexts" -OutputFile "$configFolder\contexts.txt"
Write-Host "✅ CONTEXTS extraction completata → contexts.txt" -ForegroundColor Green

<#
CONTEXTS CONTIENE:
- AppContext.js (context principale con stato globale)
- NotificationContext.js (context per toast e notifiche)
- TestContext.js (context specifico per gestione quiz)
#>

# **CONSTANTS (Costanti e Config):**
Write-Host "📋 Estraendo CONSTANTS..." -ForegroundColor Blue
.\extract.ps1 -SourcePath ".\..\src\constants" -OutputFile "$configFolder\constants.txt"
Write-Host "✅ CONSTANTS extraction completata → constants.txt" -ForegroundColor Green

<#
CONSTANTS CONTIENE:
- appConstants.js (costanti applicazione, categorie, stili)
- apiConstants.js (URL API, timeout, configurazioni)
- uiConstants.js (costanti UI, colori, temi)
- testConstants.js (configurazione quiz e punteggi)
#>

# **COMPONENTS (Componenti UI):**
Write-Host "🧩 Estraendo COMPONENTS..." -ForegroundColor Blue
.\extract.ps1 -SourcePath ".\..\src\components" -OutputFile "$configFolder\components.txt"
Write-Host "✅ COMPONENTS extraction completata → components.txt" -ForegroundColor Green

<#
COMPONENTS CONTIENE:
- AppRouter.js (routing dell'applicazione)
- EnhancedAddWordForm.js (form per aggiungere parole)
- WordsList.js (lista parole con filtri)
- TestCard.js (carta quiz interattiva)
- TestResults.js (componente risultati)
- StatsOverview.js (dashboard statistiche)
- ChapterTestSelector.js (selettore capitoli)
- Tutti i componenti UI (Button, Card, Modal, etc.)
- Error Boundaries (gestione errori)
- Layout components (Header, Navigation, etc.)
#>

# =====================================================
# MESSAGGIO DI COMPLETAMENTO
# =====================================================

Write-Host "`n🎉 OPERAZIONE COMPLETATA CON SUCCESSO!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green

# **RIEPILOGO OUTPUT:**
Write-Host "`n📁 FILE CREATI nella cartella '$configFolder':" -ForegroundColor Cyan
Write-Host "   📄 root.txt       → Configurazione, Docker, package.json, scripts" -ForegroundColor White
Write-Host "   📱 views.txt      → Pagine React (MainView, TestView, etc.)" -ForegroundColor White
Write-Host "   🔧 utils.txt      → Funzioni utility e helpers" -ForegroundColor White
Write-Host "   🌐 services.txt   → Servizi API e business logic" -ForegroundColor White
Write-Host "   🏗️ layouts.txt    → Layout components e strutture" -ForegroundColor White
Write-Host "   🪝 hooks.txt      → Custom React hooks" -ForegroundColor White
Write-Host "   🌍 contexts.txt   → Context API e state management" -ForegroundColor White
Write-Host "   📋 constants.txt  → Costanti e configurazioni" -ForegroundColor White
Write-Host "   🧩 components.txt → Componenti UI e routing" -ForegroundColor White

# **STATISTICHE:**
$fileCount = (Get-ChildItem -Path $configFolder -Filter "*.txt").Count
$totalSize = (Get-ChildItem -Path $configFolder -Filter "*.txt" | Measure-Object -Property Length -Sum).Sum
$totalSizeKB = [math]::Round($totalSize / 1KB, 2)

Write-Host "`n📊 STATISTICHE:" -ForegroundColor Yellow
Write-Host "   📁 File creati: $fileCount" -ForegroundColor White
Write-Host "   📐 Dimensione totale: $totalSizeKB KB" -ForegroundColor White

# **ISTRUZIONI UTILIZZO:**
Write-Host "`n💡 COME USARE I FILE GENERATI:" -ForegroundColor Magenta
Write-Host "   1. 🤖 Per AI Analysis: Copia il contenuto di uno o più file e incollalo in ChatGPT" -ForegroundColor White
Write-Host "   2. 📖 Per Code Review: Apri i file con un editor per analisi strutturata" -ForegroundColor White
Write-Host "   3. 📚 Per Documentazione: Usa come base per wiki o documentazione progetto" -ForegroundColor White
Write-Host "   4. 🔍 Per Debug: Cerca in file specifici invece che in tutto il codebase" -ForegroundColor White

# **SUGGERIMENTI ANALISI:**
Write-Host "`n🎯 SUGGERIMENTI PER ANALISI MIRATA:" -ForegroundColor Cyan
Write-Host "   • 🐛 Bug in pagine → Guarda views.txt" -ForegroundColor White
Write-Host "   • 🔄 Problemi state → Guarda contexts.txt e hooks.txt" -ForegroundColor White
Write-Host "   • 🎨 Problemi UI → Guarda components.txt" -ForegroundColor White
Write-Host "   • 🌐 Problemi API → Guarda services.txt" -ForegroundColor White
Write-Host "   • ⚙️ Configurazione → Guarda root.txt e constants.txt" -ForegroundColor White

# **NEXT STEPS:**
Write-Host "`n🚀 PROSSIMI PASSI SUGGERITI:" -ForegroundColor Green
Write-Host "   1. Apri i file in ordine di priorità per la tua analisi" -ForegroundColor White
Write-Host "   2. Se serve tutto insieme: concatena i file che ti interessano" -ForegroundColor White
Write-Host "   3. Per aggiornare: ri-esegui questo script quando cambi il codice" -ForegroundColor White

Write-Host "`n✨ Happy Coding! ✨" -ForegroundColor Rainbow

# =====================================================
# NOTE TECNICHE E LIMITAZIONI
# =====================================================

<#
**PERFORMANCE:**
- Script veloce per progetti medi (sotto 100MB di codice)
- Per progetti enormi, considera di filtrare ulteriormente

**MANUTENZIONE:**
- Se aggiungi nuove cartelle src\, aggiornale in $specificPaths
- Se cambi struttura progetto, adatta i percorsi
- Re-esegui quando fai modifiche significative al codice

**PERSONALIZZAZIONE:**
- Modifica $specificPaths per includere/escludere cartelle
- Cambia $configFolder per output in posizione diversa
- Aggiungi filtri aggiuntivi nelle chiamate extract.ps1

**RISOLUZIONE PROBLEMI:**
- Se errore "path not found": controlla che lo script sia in scripts\
- Se file vuoti: verifica che le cartelle src esistano
- Se permessi negati: esegui PowerShell come amministratore

**INTEGRAZIONE CI/CD:**
- Puoi automatizzare questo script prima del deploy
- Utile per generare documentazione automatica
- Combinabile con script di security check
#>

# =====================================================
# ESEMPI DI USO AVANZATO:
# =====================================================

<#
**ESEMPIO 1 - Solo componenti UI:**
.\extract.ps1 -SourcePath ".\..\src\components" -OutputFile "solo_componenti.txt"

**ESEMPIO 2 - Tutto tranne tests:**
$pathsToSkip = @("..\src\__tests__", "..\src\test")
.\extract.ps1 -SourcePath ".\..\src" -OutputFile "src_no_tests.txt" -PathsToSkip $pathsToSkip

**ESEMPIO 3 - Per analisi AI specifica:**
# Combina hook + contexts per analisi state management
Get-Content "$configFolder\hooks.txt", "$configFolder\contexts.txt" | Out-File "state_management.txt"

**ESEMPIO 4 - Monitoring cambiamenti:**
# Esegui periodicamente e confronta con versioni precedenti
# Utile per vedere l'evoluzione del codebase
#>