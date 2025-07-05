param(
    [Parameter(Mandatory=$true)]
    [string]$SourcePath,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "extracted_files_content.txt"
)

# Verifica che il path esista
if (-not (Test-Path -Path $SourcePath)) {
    Write-Error "Il path specificato non esiste: $SourcePath"
    exit 1
}

# Converte il path in formato assoluto per evitare problemi
$SourcePath = Resolve-Path -Path $SourcePath

# Definisce le estensioni di file da processare
$TargetExtensions = @('.js', '.json', '.conf', '.md', '.yml', '.yaml')

# Definisce le cartelle da escludere
$ExcludedFolders = @('.idea', '.github', 'node_modules')

# Crea o svuota il file di output
if (Test-Path -Path $OutputFile) {
    Write-Host "Il file di output esiste già. Verrà utilizzato in modalità append." -ForegroundColor Yellow
} else {
    New-Item -Path $OutputFile -ItemType File -Force | Out-Null
    Write-Host "Creato nuovo file di output: $OutputFile" -ForegroundColor Green
}

Write-Host "Inizio scansione del path: $SourcePath" -ForegroundColor Cyan
Write-Host "File di output: $OutputFile" -ForegroundColor Cyan

# Contatori per statistiche
$ProcessedFiles = 0
$SkippedFiles = 0

try {
    # Ottiene tutti i file ricorsivamente
    $AllFiles = Get-ChildItem -Path $SourcePath -Recurse -File
    
    foreach ($File in $AllFiles) {
        # Verifica se il file è in una cartella esclusa
        $IsExcluded = $false
        foreach ($ExcludedFolder in $ExcludedFolders) {
            if ($File.DirectoryName -like "*\$ExcludedFolder" -or $File.DirectoryName -like "*\$ExcludedFolder\*") {
                $IsExcluded = $true
                break
            }
        }
        
        if ($IsExcluded) {
            $SkippedFiles++
            continue
        }
        
        # Verifica se il file ha un'estensione target o è un Dockerfile
        $ShouldProcess = $false
        
        # Controlla le estensioni
        if ($File.Extension -in $TargetExtensions) {
            $ShouldProcess = $true
        }
        
        # Controlla se è un Dockerfile (senza estensione)
        if ($File.Name -eq "Dockerfile" -or $File.Name -like "Dockerfile.*") {
            $ShouldProcess = $true
        }
        
        if (-not $ShouldProcess) {
            $SkippedFiles++
            continue
        }
        
        try {
            # Calcola il percorso relativo in modo più robusto
            # Assicura che il SourcePath finisca con un backslash
            $NormalizedSourcePath = $SourcePath.TrimEnd('\') + '\'
            $RelativePath = $File.FullName.Substring($NormalizedSourcePath.Length)
            
            Write-Host "Processando: $RelativePath" -ForegroundColor Gray
            
            # Legge il contenuto del file
            $FileContent = Get-Content -Path $File.FullName -Raw -Encoding UTF8
            
            # Se il file è vuoto, gestisce il caso
            if ([string]::IsNullOrEmpty($FileContent)) {
                $FileContent = "[FILE VUOTO]"
            }
            
            # Prepara il contenuto da scrivere
            $OutputContent = @"
NOME FILE: $RelativePath

$FileContent

================================================================================

"@
            
            # Scrive nel file di output
            Add-Content -Path $OutputFile -Value $OutputContent -Encoding UTF8
            $ProcessedFiles++
            
        } catch {
            Write-Warning "Errore durante la lettura del file: $($File.FullName) - $($_.Exception.Message)"
            $SkippedFiles++
        }
    }
    
    # Statistiche finali
    Write-Host "`n=== STATISTICHE ===" -ForegroundColor Green
    Write-Host "File processati: $ProcessedFiles" -ForegroundColor Green
    Write-Host "File saltati: $SkippedFiles" -ForegroundColor Yellow
    Write-Host "Output salvato in: $OutputFile" -ForegroundColor Green
    
} catch {
    Write-Error "Errore durante l'esecuzione dello script: $($_.Exception.Message)"
    exit 1
}

Write-Host "`nScript completato con successo!" -ForegroundColor Green