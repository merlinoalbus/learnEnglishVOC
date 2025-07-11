# =====================================================
# 📁 scripts/extract.ps1 - SCRIPT ESTRAZIONE CODICE DOCUMENTATO COMPLETO
# =====================================================

<#
**SCOPO DELLO SCRIPT:**
Questo script PowerShell estrae il contenuto di tutti i file di codice da una cartella
e li combina in un singolo file di testo. È molto utile per:
- Analizzare la struttura di un progetto
- Creare documentazione automatica  
- Fare backup del codice in formato testo
- Permettere ad AI/ChatGPT di analizzare tutto il codice insieme

**QUANDO USARLO:**
- Quando vuoi vedere tutto il codice di un progetto in un file solo
- Per creare input per analisi AI del codice
- Per documentazione o archivio
- Per debug di problemi complessi che coinvolgono più file

**COME FUNZIONA:**
1. Scansiona ricorsivamente una cartella (e sottocartelle)
2. Filtra solo i file di codice (js, css, html, etc.)
3. Esclude cartelle di sistema (node_modules, build, etc.)
4. Combina tutto il contenuto in un file di output
5. Aggiunge header per identificare ogni file

**ESEMPI DI USO:**
.\extract.ps1 -SourcePath ".\src" -OutputFile "codice_src.txt"
.\extract.ps1 -SourcePath ".\..\" -OutputFile "tutto_progetto.txt" -PathsToSkip @("..\node_modules", "..\build")
#>

# =====================================================
# DEFINIZIONE PARAMETRI SCRIPT
# =====================================================

# **param():** Definisce i parametri che possono essere passati allo script
param(
    # **SourcePath:** La cartella da scansionare (OBBLIGATORIO)
    # [Parameter(Mandatory=$true)] = PowerShell chiederà questo parametro se manca
    [Parameter(Mandatory=$true)]
    [string]$SourcePath,
    
    # **OutputFile:** Il file dove salvare tutto il codice estratto (OPZIONALE)
    # Se non specificato, usa "extracted_files_content.txt" come default
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "extracted_files_content.txt",

    # **PathsToSkip:** Array di percorsi da saltare (OPZIONALE)
    # Es: @("node_modules", "build") per saltare queste cartelle
    [Parameter(Mandatory=$false)]
    [string[]]$PathsToSkip
)

# =====================================================
# VALIDAZIONE INPUT
# =====================================================

# **Test-Path:** Controlla se un percorso esiste nel filesystem
# -not inverte il risultato: se il path NON esiste, esegui il blocco
if (-not (Test-Path -Path $SourcePath)) {
    # Write-Error stampa un messaggio di errore e ferma lo script
    Write-Error "Il path specificato non esiste: $SourcePath"
    # exit 1 = termina lo script con codice di errore
    exit 1
}

# **Resolve-Path:** Converte un percorso relativo in assoluto
# Es: ".\src" diventa "C:\Projects\MyApp\src"
# Questo è importante per confronti accurati dei percorsi
$resolvedSourcePath = Resolve-Path -Path $SourcePath

# =====================================================
# CONFIGURAZIONE FILTRI FILE
# =====================================================

# **ESTENSIONI TARGET:** Array delle estensioni di file da processare
# Questi sono i tipi di file di codice che ci interessano
$TargetExtensions = @(
    '.js',          # JavaScript
    '.conf',        # File di configurazione  
    '.yml',         # YAML (configurazione)
    '.yaml',        # YAML alternativo
    '.html',        # HTML
    '.css',         # CSS (stili)
    '.ts',          # TypeScript
    '.tsx',         # TypeScript React
    '.vue',         # Vue.js
    '.scss',        # SCSS (CSS avanzato)
    '.properties',  # File properties (Java/config)
    '.sh',          # Script Bash (Linux/Mac)
    '.ps1'          # Script PowerShell
)

# **CARTELLE ESCLUSE:** Array di cartelle da ignorare automaticamente
# Queste cartelle contengono file generati o librerie esterne
$ExcludedFolders = @(
    '.idea',        # IntelliJ IDEA settings
    '.gitignore',   # Git ignore file
    'config_txt',   # Cartella output di questo stesso script
    '.github',      # GitHub workflows/config
    'node_modules', # Librerie JavaScript (ENORME, da evitare)
    'dist',         # File distribuibili compilati
    'build',        # File build compilati
    'vendor',       # Librerie esterne (PHP/altro)
    'coverage',     # Report copertura test
    'test',         # Cartella test (opzionale escludere)
    'tests',        # Cartella test alternativa
    'tmp',          # File temporanei
    'temp'          # File temporanei alternativi
)

# =====================================================
# PREPARAZIONE FILE OUTPUT
# =====================================================

# **PULIZIA FILE OUTPUT:**
# Se il file esiste già, svuotalo; altrimenti crealo nuovo
if (Test-Path -Path $OutputFile) {
    # Clear-Content svuota un file esistente mantenendolo
    Clear-Content -Path $OutputFile
} else {
    # New-Item crea un nuovo file
    # -ItemType File = tipo file (non cartella)
    # -Force = crea anche le cartelle parent se non esistono
    # | Out-Null = nasconde l'output del comando
    New-Item -Path $OutputFile -ItemType File -Force | Out-Null
}

# **MESSAGGIO DI INIZIO:**
# Write-Host stampa messaggi colorati nella console
# -ForegroundColor Cyan = testo ciano/azzurro
Write-Host "Inizio scansione del path: $($resolvedSourcePath.Path) (Ricorsiva)" -ForegroundColor Cyan

# =====================================================
# PROCESSAMENTO PERCORSI DA SALTARE
# =====================================================

# **RISOLUZIONE PERCORSI DA ESCLUDERE:**
# Converte tutti i percorsi relativi in assoluti per confronti accurati
$ResolvedPathsToSkip = @()

# Controlla se sono stati specificati percorsi da saltare
if ($null -ne $PathsToSkip -and $PathsToSkip.Count -gt 0) {
    # Processa ogni percorso specificato
    foreach ($path in $PathsToSkip) {
        try {
            # Resolve-Path con -ErrorAction Stop = ferma se il path non esiste
            $absolutePath = Resolve-Path -Path $path -ErrorAction Stop
            # Aggiungi il percorso assoluto all'array
            $ResolvedPathsToSkip += $absolutePath.Path
            Write-Host "Percorso da saltare risolto: $($absolutePath.Path)" -ForegroundColor DarkYellow
        } catch {
            # Se il percorso non esiste, avvisa ma continua
            Write-Warning "Impossibile risolvere il percorso da saltare: $path"
        }
    }
}

# =====================================================
# INIZIALIZZAZIONE CONTATORI
# =====================================================

# **CONTATORI STATISTICHE:**
# Tengono traccia di quanti file vengono processati vs saltati
$ProcessedFiles = 0  # File che elaboriamo con successo
$SkippedFiles = 0    # File che saltiamo per vari motivi

# =====================================================
# SCANSIONE E PROCESSAMENTO FILE
# =====================================================

try {
    # **GET-CHILDITEM:** Il comando principale per scansionare file
    # -Path = cartella da scansionare
    # -Recurse = incluди sottocartelle (scansione ricorsiva)  
    # -File = solo file (non cartelle)
    $AllFiles = Get-ChildItem -Path $resolvedSourcePath.Path -Recurse -File
    
    # **LOOP PRINCIPALE:** Processa ogni file trovato
    foreach ($File in $AllFiles) {
        
        # =====================================================
        # CALCOLO PERCORSO RELATIVO
        # =====================================================
        
        # **PERCORSO RELATIVO:** Rimuove la parte iniziale del path per avere un path relativo
        # Es: "C:\Project\src\components\App.js" → "src\components\App.js"
        $RelativePath = $File.FullName.Substring($resolvedSourcePath.Path.Length).TrimStart('\')
        
        # Se il percorso relativo è vuoto (file nella root), usa solo il nome
        if ([string]::IsNullOrEmpty($RelativePath)) { 
            $RelativePath = $File.Name 
        }

        # =====================================================
        # CONTROLLO ESCLUSIONI MANUALI
        # =====================================================
        
        # **CONTROLLO PERCORSI MANUALI DA SALTARE:**
        $isPathManuallySkipped = $false
        
        if ($ResolvedPathsToSkip.Count -gt 0) {
            foreach ($absolutePathToSkip in $ResolvedPathsToSkip) {
                # **StartsWith:** Controlla se il percorso del file inizia con il percorso da saltare
                # [System.StringComparison]::OrdinalIgnoreCase = confronto case-insensitive
                if ($File.FullName.StartsWith($absolutePathToSkip, [System.StringComparison]::OrdinalIgnoreCase)) {
                    $isPathManuallySkipped = $true
                    Write-Host "Saltato (Percorso escluso manualmente): $RelativePath" -ForegroundColor Red
                    break  # Esce dal loop interno
                }
            }
        }
        
        # Se il file è in un percorso da saltare manualmente, passa al prossimo
        if ($isPathManuallySkipped) {
            $SkippedFiles++
            continue  # Salta alla prossima iterazione del loop
        }
        
        # =====================================================
        # CONTROLLO CARTELLE ESCLUSE AUTOMATICAMENTE
        # =====================================================
        
        # **CONTROLLO CARTELLE ESCLUSE:**
        $isFolderExcluded = $false
        
        foreach ($ExcludedFolder in $ExcludedFolders) {
            # **CONTROLLO PATTERN:** Verifica se il file è dentro una cartella esclusa
            # -like supporta wildcard come *
            # *\node_modules = qualsiasi path che finisce con \node_modules
            # *\node_modules\* = qualsiasi path che contiene \node_modules\
            if ($File.DirectoryName -like "*\$ExcludedFolder" -or $File.DirectoryName -like "*\$ExcludedFolder\*") {
                $isFolderExcluded = $true
                break
            }
        }
        
        # Se il file è in una cartella esclusa, saltalo
        if ($isFolderExcluded) {
            $SkippedFiles++
            continue
        }
        
        # =====================================================
        # CONTROLLO ESTENSIONE FILE
        # =====================================================
        
        # **CONTROLLO TIPO FILE:**
        $ShouldProcess = $false
        
        # Controlla se l'estensione è nella lista target
        if (($File.Extension -in $TargetExtensions) -or 
            ($File.Name -eq "Dockerfile") -or 
            ($File.Name -like "Dockerfile.*")) {
            $ShouldProcess = $true
        }
        
        # Se il file non è di un tipo che ci interessa, saltalo
        if (-not $ShouldProcess) {
            Write-Host "Saltato (Tipo di file non valido): $RelativePath" -ForegroundColor Yellow
            $SkippedFiles++
            continue
        }
        
        # =====================================================
        # LETTURA E PROCESSAMENTO FILE
        # =====================================================
        
        try {
            # **MESSAGGIO PROCESSING:**
            Write-Host "Processando: $RelativePath" -ForegroundColor Gray
            
            # **GET-CONTENT:** Legge tutto il contenuto del file
            # -Path = file da leggere
            # -Raw = legge come stringa unica (non array di righe)
            # -ErrorAction Stop = ferma se c'è errore
            # -Encoding UTF8 = gestisce caratteri speciali correttamente
            $FileContent = Get-Content -Path $File.FullName -Raw -ErrorAction Stop -Encoding UTF8
            
            # **NORMALIZZAZIONE NEWLINE:** 
            # Sostituisce tutte le combinazioni di newline con spazi
            # \r\n (Windows) e \n (Unix/Mac) → spazio singolo
            # Questo rende il testo più compatto nel file output
            $FileContent = $FileContent -replace "\r?\n", " "
            
            # **CONTROLLO FILE VUOTO:**
            # Se il file è vuoto o contiene solo spazi, aggiungi un placeholder
            if ([string]::IsNullOrEmpty($FileContent.Trim())) {
                $FileContent = "[FILE VUOTO]"
            }
            
            # =====================================================
            # CREAZIONE OUTPUT FORMATTATO
            # =====================================================
            
            # **TEMPLATE OUTPUT:** Crea il blocco formattato per questo file
            # @"..."@ è un here-string PowerShell per testo multi-linea
            $OutputContent = @"
NOME FILE: $RelativePath

$FileContent

================================================================================

"@
            
            # **APPEND AL FILE OUTPUT:**
            # Add-Content aggiunge il contenuto al file senza sovrascriverlo
            # -Encoding UTF8 = mantiene caratteri speciali
            Add-Content -Path $OutputFile -Value $OutputContent -Encoding UTF8
            
            # Incrementa contatore successi
            $ProcessedFiles++
            
        } catch {
            # **GESTIONE ERRORI LETTURA FILE:**
            # Se non riusciamo a leggere il file (permessi, corruzione, etc.)
            Write-Warning "Errore durante la lettura del file: $($File.FullName) - $($_.Exception.Message)"
            $SkippedFiles++
        }
    }
    
    # =====================================================
    # STATISTICHE FINALI
    # =====================================================
    
    # **REPORT FINALE:** Mostra quanti file sono stati processati
    Write-Host "`n=== STATISTICHE ($($resolvedSourcePath.Path)) ===" -ForegroundColor Green
    Write-Host "File processati: $ProcessedFiles" -ForegroundColor Green
    Write-Host "File saltati: $SkippedFiles" -ForegroundColor Yellow
    Write-Host "Output salvato in: $OutputFile" -ForegroundColor Green
    
} catch {
    # **GESTIONE ERRORI GENERALI:**
    # Se c'è un errore durante la scansione principale
    Write-Error "Errore durante l'esecuzione dello script: $($_.Exception.Message)"
    exit 1
}

# **MESSAGGIO COMPLETAMENTO:**
Write-Host "`nCompletato per $($resolvedSourcePath.Path)`n" -ForegroundColor Green

# =====================================================
# ESEMPI DI UTILIZZO PRATICO:
# =====================================================

<#
**ESEMPIO 1 - Estrai solo cartella src:**
.\extract.ps1 -SourcePath ".\src" -OutputFile "codice_src.txt"

**ESEMPIO 2 - Estrai tutto il progetto escludendo specifiche cartelle:**
.\extract.ps1 -SourcePath ".\" -OutputFile "progetto_completo.txt" -PathsToSkip @(".\node_modules", ".\build", ".\dist")

**ESEMPIO 3 - Estrai per analisi AI:**
.\extract.ps1 -SourcePath ".\src" -OutputFile "per_chatgpt.txt"
# Poi copia il contenuto di per_chatgpt.txt e incollalo in ChatGPT per analisi

**ESEMPIO 4 - Backup codice:**
.\extract.ps1 -SourcePath ".\" -OutputFile "backup_$(Get-Date -Format 'yyyy-MM-dd').txt"
#>

# =====================================================
# NOTE TECNICHE AVANZATE:
# =====================================================

<#
**GESTIONE MEMORIA:**
- Get-ChildItem -Recurse può usare molta memoria su progetti grandi
- PowerShell carica tutto in memoria, quindi attento con progetti enormi

**ENCODING:**
- UTF8 gestisce caratteri speciali, emoji, caratteri accentati
- Importante per codice internazionale o con commenti non-inglesi

**PERFORMANCE:**
- Il filtro per estensione avviene DOPO la scansione completa
- Per progetti enormi, considera di filtrare durante Get-ChildItem

**COMPATIBILITÀ:**
- Script compatibile con PowerShell 5.1+ (Windows)
- Funziona anche su PowerShell Core (Linux/Mac) ma path potrebbero differire

**LIMITAZIONI:**
- Non gestisce file binari (immagini, video, etc.)
- File molto grandi potrebbero causare problemi di memoria
- Alcuni caratteri speciali potrebbero non essere gestiti perfettamente

**DEBUG:**
- Se lo script si blocca, controlla cartelle enormi come node_modules
- Aggiungi più ExcludedFolders se necessario
- Use Write-Host per debug intermedi
#>