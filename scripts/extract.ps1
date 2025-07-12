# =====================================================
# 📁 scripts/extract.ps1 - ESTRAZIONE CODICE SENZA COMMENTI
# =====================================================

<#
**SCOPO DELLO SCRIPT AGGIORNATO:**
Questo script PowerShell estrae il contenuto di tutti i file di codice da una cartella
e li combina in un singolo file di testo RIMUOVENDO AUTOMATICAMENTE TUTTI I COMMENTI.

**NUOVA FUNZIONALITÀ:**
- Rimuove commenti JavaScript (// e /* */)
- Rimuove commenti CSS (/* */)
- Rimuove commenti HTML (<!-- -->)
- Rimuove commenti Python (#)
- Rimuove commenti PowerShell (#)
- Rimuove commenti JSDoc (/** */)
- Rimuove commenti TypeScript (// e /* */)
- Preserva stringhe con caratteri di commento al loro interno

**VANTAGGI:**
- Output più pulito e conciso
- Focus sul codice effettivo
- Riduce dimensione file di output
- Migliore per analisi AI (meno token sprecati)
#>

# =====================================================
# DEFINIZIONE PARAMETRI SCRIPT
# =====================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$SourcePath,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "extracted_files_content.txt",

    [Parameter(Mandatory=$false)]
    [string[]]$PathsToSkip,

    # **NUOVO PARAMETRO:** Opzione per mantenere commenti
    [Parameter(Mandatory=$false)]
    [switch]$KeepComments = $false
)

# =====================================================
# VALIDAZIONE INPUT
# =====================================================

if (-not (Test-Path -Path $SourcePath)) {
    Write-Error "Il path specificato non esiste: $SourcePath"
    exit 1
}

$resolvedSourcePath = Resolve-Path -Path $SourcePath

# =====================================================
# CONFIGURAZIONE FILTRI FILE
# =====================================================

$TargetExtensions = @(
    '.js',          # JavaScript
    '.jsx',         # React JavaScript
    '.ts',          # TypeScript
    '.tsx',         # TypeScript React
    '.css',         # CSS
    '.scss',        # SCSS
    '.html',        # HTML
    '.htm',         # HTML alternativo
    '.vue',         # Vue.js
    '.conf',        # Configurazione
    '.yml',         # YAML
    '.yaml',        # YAML alternativo
    '.json',        # JSON (senza commenti, ma per completezza)
    '.properties',  # File properties
    '.sh',          # Script Bash
    '.ps1',         # Script PowerShell
    '.py',          # Python
    '.php'          # PHP
)

$ExcludedFolders = @(
    '.idea',
    '.gitignore',
    'config_txt',
    '.github',
    '.vscode',
    'public',
    'scripts',
    'node_modules',
    'dist',
    'build',
    'vendor',
    'coverage',
    'test',
    'tests',
    'tmp',
    'temp',
    '.next',
    '.nuxt',
    '.output'
)

# =====================================================
# FUNZIONI RIMOZIONE COMMENTI
# =====================================================

function Remove-Comments {
    param(
        [string]$Content,
        [string]$FileExtension
    )

    if ($KeepComments) {
        return $Content
    }

    switch ($FileExtension.ToLower()) {
        {$_ -in @('.js', '.jsx', '.ts', '.tsx')} {
            return Remove-JavaScriptComments $Content
        }
        {$_ -in @('.css', '.scss')} {
            return Remove-CSSComments $Content
        }
        {$_ -in @('.html', '.htm')} {
            return Remove-HTMLComments $Content
        }
        '.vue' {
            # Vue files hanno mix di HTML, CSS e JS
            $Content = Remove-HTMLComments $Content
            $Content = Remove-CSSComments $Content
            $Content = Remove-JavaScriptComments $Content
            return $Content
        }
        '.py' {
            return Remove-PythonComments $Content
        }
        '.php' {
            return Remove-PHPComments $Content
        }
        {$_ -in @('.ps1', '.sh')} {
            return Remove-ShellComments $Content
        }
        {$_ -in @('.yml', '.yaml')} {
            return Remove-YAMLComments $Content
        }
        default {
            return $Content
        }
    }
}

# =====================================================
# FUNZIONI SPECIFICHE PER LINGUAGGIO
# =====================================================

function Remove-JavaScriptComments {
    param([string]$Content)
    
    $lines = $Content -split "`n"
    $result = @()
    $inBlockComment = $false
    
    foreach ($line in $lines) {
        $cleanLine = $line
        $inString = $false
        $stringChar = $null
        $i = 0
        
        while ($i -lt $cleanLine.Length) {
            $char = $cleanLine[$i]
            
            # Gestione stringhe (per non rimuovere // dentro stringhe)
            if (($char -eq '"' -or $char -eq "'") -and -not $inString) {
                $inString = $true
                $stringChar = $char
            }
            elseif ($char -eq $stringChar -and $inString) {
                # Controlla se non è escaped
                $backslashCount = 0
                for ($j = $i - 1; $j -ge 0 -and $cleanLine[$j] -eq '\'; $j--) {
                    $backslashCount++
                }
                if ($backslashCount % 2 -eq 0) {
                    $inString = $false
                    $stringChar = $null
                }
            }
            
            # Gestione commenti se non siamo in una stringa
            if (-not $inString) {
                # Fine commento a blocco
                if ($inBlockComment -and $i -lt $cleanLine.Length - 1 -and 
                    $cleanLine[$i] -eq '*' -and $cleanLine[$i + 1] -eq '/') {
                    $inBlockComment = $false
                    $cleanLine = $cleanLine.Substring($i + 2)
                    $i = -1
                    continue
                }
                
                # Inizio commento a blocco
                if (-not $inBlockComment -and $i -lt $cleanLine.Length - 1 -and 
                    $cleanLine[$i] -eq '/' -and $cleanLine[$i + 1] -eq '*') {
                    $inBlockComment = $true
                    $cleanLine = $cleanLine.Substring(0, $i)
                    break
                }
                
                # Commento linea singola
                if (-not $inBlockComment -and $i -lt $cleanLine.Length - 1 -and 
                    $cleanLine[$i] -eq '/' -and $cleanLine[$i + 1] -eq '/') {
                    $cleanLine = $cleanLine.Substring(0, $i)
                    break
                }
            }
            
            $i++
        }
        
        # Aggiungi la riga solo se non siamo in un commento a blocco
        if (-not $inBlockComment) {
            $trimmedLine = $cleanLine.Trim()
            if ($trimmedLine -ne '') {
                $result += $trimmedLine
            }
        }
    }
    
    return ($result -join " ")
}

function Remove-CSSComments {
    param([string]$Content)
    
    # Rimuove commenti CSS /* */
    $Content = $Content -replace '/\*[\s\S]*?\*/', ''
    
    # Rimuove righe vuote multiple
    $Content = $Content -replace '\s+', ' '
    
    return $Content.Trim()
}

function Remove-HTMLComments {
    param([string]$Content)
    
    # Rimuove commenti HTML <!-- -->
    $Content = $Content -replace '<!--[\s\S]*?-->', ''
    
    # Rimuove spazi multipli
    $Content = $Content -replace '\s+', ' '
    
    return $Content.Trim()
}

function Remove-PythonComments {
    param([string]$Content)
    
    $lines = $Content -split "`n"
    $result = @()
    $inTripleQuote = $false
    $quoteType = $null
    
    foreach ($line in $lines) {
        $cleanLine = $line
        $inString = $false
        $stringChar = $null
        
        # Gestione triple quotes (docstrings)
        if ($cleanLine -match '"""' -or $cleanLine -match "'''") {
            if ($cleanLine -match '"""') {
                if (-not $inTripleQuote) {
                    $inTripleQuote = $true
                    $quoteType = '"""'
                } elseif ($quoteType -eq '"""') {
                    $inTripleQuote = $false
                    $quoteType = $null
                }
            }
            if ($cleanLine -match "'''") {
                if (-not $inTripleQuote) {
                    $inTripleQuote = $true
                    $quoteType = "'''"
                } elseif ($quoteType -eq "'''") {
                    $inTripleQuote = $false
                    $quoteType = $null
                }
            }
        }
        
        if ($inTripleQuote) {
            continue
        }
        
        # Rimuove commenti # (gestendo stringhe)
        $commentIndex = -1
        for ($i = 0; $i -lt $cleanLine.Length; $i++) {
            $char = $cleanLine[$i]
            
            if (($char -eq '"' -or $char -eq "'") -and -not $inString) {
                $inString = $true
                $stringChar = $char
            }
            elseif ($char -eq $stringChar -and $inString) {
                $inString = $false
                $stringChar = $null
            }
            elseif ($char -eq '#' -and -not $inString) {
                $commentIndex = $i
                break
            }
        }
        
        if ($commentIndex -ge 0) {
            $cleanLine = $cleanLine.Substring(0, $commentIndex)
        }
        
        $trimmedLine = $cleanLine.Trim()
        if ($trimmedLine -ne '') {
            $result += $trimmedLine
        }
    }
    
    return ($result -join " ")
}

function Remove-PHPComments {
    param([string]$Content)
    
    # Rimuove commenti PHP // e /* */
    $Content = Remove-JavaScriptComments $Content
    
    # Rimuove anche commenti # style
    $lines = $Content -split " "
    $result = @()
    
    foreach ($line in $lines) {
        if ($line -notmatch '^\s*#') {
            $hashIndex = $line.IndexOf('#')
            if ($hashIndex -gt 0) {
                $line = $line.Substring(0, $hashIndex).Trim()
            }
            if ($line -ne '') {
                $result += $line
            }
        }
    }
    
    return ($result -join " ")
}

function Remove-ShellComments {
    param([string]$Content)
    
    $lines = $Content -split "`n"
    $result = @()
    
    foreach ($line in $lines) {
        # Salta righe che iniziano con #
        if ($line -match '^\s*#') {
            continue
        }
        
        # Rimuove commenti inline #
        $commentIndex = $line.IndexOf('#')
        if ($commentIndex -ge 0) {
            $line = $line.Substring(0, $commentIndex)
        }
        
        $trimmedLine = $line.Trim()
        if ($trimmedLine -ne '') {
            $result += $trimmedLine
        }
    }
    
    return ($result -join " ")
}

function Remove-YAMLComments {
    param([string]$Content)
    
    return Remove-ShellComments $Content  # YAML usa stesso stile di commenti
}

# =====================================================
# PREPARAZIONE FILE OUTPUT
# =====================================================

if (Test-Path -Path $OutputFile) {
    Clear-Content -Path $OutputFile
} else {
    New-Item -Path $OutputFile -ItemType File -Force | Out-Null
}

if ($KeepComments) {
    Write-Host "Inizio scansione del path: $($resolvedSourcePath.Path) (MANTENENDO commenti)" -ForegroundColor Cyan
} else {
    Write-Host "Inizio scansione del path: $($resolvedSourcePath.Path) (RIMUOVENDO commenti)" -ForegroundColor Cyan
}

# =====================================================
# PROCESSAMENTO PERCORSI DA SALTARE
# =====================================================

$ResolvedPathsToSkip = @()

if ($null -ne $PathsToSkip -and $PathsToSkip.Count -gt 0) {
    foreach ($path in $PathsToSkip) {
        try {
            $absolutePath = Resolve-Path -Path $path -ErrorAction Stop
            $ResolvedPathsToSkip += $absolutePath.Path
            Write-Host "Percorso da saltare risolto: $($absolutePath.Path)" -ForegroundColor DarkYellow
        } catch {
            Write-Warning "Impossibile risolvere il percorso da saltare: $path"
        }
    }
}

# =====================================================
# INIZIALIZZAZIONE CONTATORI
# =====================================================

$ProcessedFiles = 0
$SkippedFiles = 0
$CommentLinesRemoved = 0

# =====================================================
# SCANSIONE E PROCESSAMENTO FILE
# =====================================================

try {
    $AllFiles = Get-ChildItem -Path $resolvedSourcePath.Path -Recurse -File
    
    foreach ($File in $AllFiles) {
        
        # CALCOLO PERCORSO RELATIVO
        $RelativePath = $File.FullName.Substring($resolvedSourcePath.Path.Length).TrimStart('\')
        
        if ([string]::IsNullOrEmpty($RelativePath)) { 
            $RelativePath = $File.Name 
        }

        # CONTROLLO ESCLUSIONI MANUALI
        $isPathManuallySkipped = $false
        
        if ($ResolvedPathsToSkip.Count -gt 0) {
            foreach ($absolutePathToSkip in $ResolvedPathsToSkip) {
                if ($File.FullName.StartsWith($absolutePathToSkip, [System.StringComparison]::OrdinalIgnoreCase)) {
                    $isPathManuallySkipped = $true
                    Write-Host "Saltato (Percorso escluso manualmente): $RelativePath" -ForegroundColor Red
                    break
                }
            }
        }
        
        if ($isPathManuallySkipped) {
            $SkippedFiles++
            continue
        }
        
        # CONTROLLO CARTELLE ESCLUSE
        $isFolderExcluded = $false
        
        foreach ($ExcludedFolder in $ExcludedFolders) {
            if ($File.DirectoryName -like "*\$ExcludedFolder" -or $File.DirectoryName -like "*\$ExcludedFolder\*") {
                $isFolderExcluded = $true
                break
            }
        }
        
        if ($isFolderExcluded) {
            $SkippedFiles++
            continue
        }
        
        # CONTROLLO ESTENSIONE FILE
        $ShouldProcess = $false
        
        if (($File.Extension -in $TargetExtensions) -or 
            ($File.Name -eq "Dockerfile") -or 
            ($File.Name -like "Dockerfile.*")) {
            $ShouldProcess = $true
        }
        
        if (-not $ShouldProcess) {
            Write-Host "Saltato (Tipo di file non valido): $RelativePath" -ForegroundColor Yellow
            $SkippedFiles++
            continue
        }
        
        # LETTURA E PROCESSAMENTO FILE
        try {
            Write-Host "Processando: $RelativePath" -ForegroundColor Gray
            
            $FileContent = Get-Content -Path $File.FullName -Raw -ErrorAction Stop -Encoding UTF8
            
            # **RIMOZIONE COMMENTI:**
            $OriginalLength = $FileContent.Length
            $CleanContent = Remove-Comments -Content $FileContent -FileExtension $File.Extension
            $NewLength = $CleanContent.Length
            
            if ($NewLength -lt $OriginalLength) {
                $CommentLinesRemoved += ($OriginalLength - $NewLength)
            }
            
            # Normalizza newlines e spazi
            $CleanContent = $CleanContent -replace "\r?\n", " "
            $CleanContent = $CleanContent -replace "\s+", " "
            
            if ([string]::IsNullOrEmpty($CleanContent.Trim())) {
                $CleanContent = "[FILE VUOTO DOPO RIMOZIONE COMMENTI]"
            }
            
            # CREAZIONE OUTPUT FORMATTATO
            $OutputContent = @"
NOME FILE: $RelativePath

$($CleanContent.Trim())

================================================================================

"@
            
            Add-Content -Path $OutputFile -Value $OutputContent -Encoding UTF8
            $ProcessedFiles++
            
        } catch {
            Write-Warning "Errore durante la lettura del file: $($File.FullName) - $($_.Exception.Message)"
            $SkippedFiles++
        }
    }
    
    # STATISTICHE FINALI
    Write-Host "`n=== STATISTICHE ($($resolvedSourcePath.Path)) ===" -ForegroundColor Green
    Write-Host "File processati: $ProcessedFiles" -ForegroundColor Green
    Write-Host "File saltati: $SkippedFiles" -ForegroundColor Yellow
    if (-not $KeepComments) {
        Write-Host "Caratteri rimossi (commenti): $CommentLinesRemoved" -ForegroundColor Magenta
    }
    Write-Host "Output salvato in: $OutputFile" -ForegroundColor Green
    
} catch {
    Write-Error "Errore durante l'esecuzione dello script: $($_.Exception.Message)"
    exit 1
}

Write-Host "`nCompletato per $($resolvedSourcePath.Path)`n" -ForegroundColor Green

# =====================================================
# ESEMPI DI UTILIZZO AGGIORNATI:
# =====================================================

<#
**ESEMPIO 1 - Estrai senza commenti (default):**
.\extract.ps1 -SourcePath ".\src" -OutputFile "codice_pulito.txt"

**ESEMPIO 2 - Estrai mantenendo commenti:**
.\extract.ps1 -SourcePath ".\src" -OutputFile "codice_con_commenti.txt" -KeepComments

**ESEMPIO 3 - Estrai progetto completo pulito:**
.\extract.ps1 -SourcePath ".\" -OutputFile "progetto_pulito.txt" -PathsToSkip @(".\node_modules", ".\build")

**ESEMPIO 4 - Solo JavaScript/TypeScript pulito:**
.\extract.ps1 -SourcePath ".\src" -OutputFile "solo_js_pulito.txt"
#>