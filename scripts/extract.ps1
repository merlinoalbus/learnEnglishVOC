param(
    [Parameter(Mandatory=$true)]
    [string]$SourcePath,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "extracted_files_content.txt",

    [Parameter(Mandatory=$false)]
    [string[]]$PathsToSkip
)

# Verifica che il path esista
if (-not (Test-Path -Path $SourcePath)) {
    Write-Error "Il path specificato non esiste: $SourcePath"
    exit 1
}

# Converte il path in formato assoluto
$resolvedSourcePath = Resolve-Path -Path $SourcePath

# Definisce le estensioni di file da processare
$TargetExtensions = @('.js','.conf', '.md', '.yml', '.yaml', '.html', '.css', '.ts', '.tsx', '.vue', '.scss', '.less', '.properties','')

# Lista di esclusione per cartelle di sistema/build
$ExcludedFolders = @('.idea', '.gitignore','config_txt','.github', 'node_modules', 'dist', 'build', 'vendor', 'coverage', 'test', 'tests', 'tmp', 'temp')

# Svuota il file di output prima di iniziare
if (Test-Path -Path $OutputFile) {
    Clear-Content -Path $OutputFile
} else {
    New-Item -Path $OutputFile -ItemType File -Force | Out-Null
}

Write-Host "Inizio scansione del path: $($resolvedSourcePath.Path) (Ricorsiva)" -ForegroundColor Cyan

# Contatori
$ProcessedFiles = 0
$SkippedFiles = 0

try {
    $AllFiles = Get-ChildItem -Path $resolvedSourcePath.Path -Recurse -File
    
    foreach ($File in $AllFiles) {
        # === PRIMA CORREZIONE QUI ===
        # Usa .Path invece di .FullName per calcolare il percorso relativo
        $RelativePath = $File.FullName.Substring($resolvedSourcePath.Path.Length).TrimStart('\')
        if ([string]::IsNullOrEmpty($RelativePath)) { $RelativePath = $File.Name }

        # Controlla se il file appartiene a un percorso da saltare
        $isPathManuallySkipped = $false
        if ($null -ne $PathsToSkip) {
            foreach ($path in $PathsToSkip) {
                # === SECONDA CORREZIONE QUI ===
                # Usa .Path invece di .FullName per costruire il percorso da saltare
                $absolutePathToSkip = Join-Path -Path $resolvedSourcePath.Path -ChildPath $path
                if ($File.FullName.StartsWith($absolutePathToSkip, [System.StringComparison]::OrdinalIgnoreCase)) {
                    $isPathManuallySkipped = $true
                    break
                }
            }
        }
        
        if ($isPathManuallySkipped) {
            $SkippedFiles++
            continue
        }
        
        # Verifica se il file è in una cartella esclusa
        $isFolderExcluded = $false
        $ExclusionReason = ""
        foreach ($ExcludedFolder in $ExcludedFolders) {
            if ($File.DirectoryName -like "*\$ExcludedFolder" -or $File.DirectoryName -like "*\$ExcludedFolder\*") {
                $isFolderExcluded = $true
                $ExclusionReason = $ExcludedFolder
                break
            }
        }
        
        if ($isFolderExcluded) {
            #Write-Host "🟡 Saltato (In cartella esclusa '$ExclusionReason'): $RelativePath" -ForegroundColor Yellow
            $SkippedFiles++
            continue
        }
        
        # Verifica l'estensione
        $ShouldProcess = $false
        if (($File.Extension -in $TargetExtensions) -or ($File.Name -eq "Dockerfile") -or ($File.Name -like "Dockerfile.*")) {
            $ShouldProcess = $true
        }
        
        if (-not $ShouldProcess) {
            Write-Host "🟡 Saltato (Tipo di file non valido): $RelativePath" -ForegroundColor Yellow
            $SkippedFiles++
            continue
        }
        
        try {
            Write-Host "⚙️ Processando: $RelativePath" -ForegroundColor Gray
            $FileContent = Get-Content -Path $File.FullName -Raw -ErrorAction Stop -Encoding UTF8
            $FileContent = $FileContent -replace "\r?\n", " "
            
            if ([string]::IsNullOrEmpty($FileContent.Trim())) {
                $FileContent = "[FILE VUOTO]"
            }
            
            $OutputContent = @"
NOME FILE: $RelativePath

$FileContent

================================================================================

"@
            
            Add-Content -Path $OutputFile -Value $OutputContent -Encoding UTF8
            $ProcessedFiles++
            
        } catch {
            Write-Warning "Errore durante la lettura del file: $($File.FullName) - $($_.Exception.Message)"
            $SkippedFiles++
        }
    }
    
    # Statistiche finali
    Write-Host "`n=== STATISTICHE ($($resolvedSourcePath.Path)) ===" -ForegroundColor Green
    Write-Host "File processati: $ProcessedFiles" -ForegroundColor Green
    Write-Host "File saltati: $SkippedFiles" -ForegroundColor Yellow
    Write-Host "Output salvato in: $OutputFile" -ForegroundColor Green
    
} catch {
    Write-Error "Errore durante l'esecuzione dello script: $($_.Exception.Message)"
    exit 1
}

Write-Host "`nCompletato per $($resolvedSourcePath.Path)`n" -ForegroundColor Green