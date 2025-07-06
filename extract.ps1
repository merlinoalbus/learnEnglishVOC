param(
    [Parameter(Mandatory=$true)]
    [string]$SourcePath,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "extracted_files_content.txt",

    [Parameter(Mandatory=$false)]
    [switch]$NoRecurse
)

# Verifica che il path esista
if (-not (Test-Path -Path $SourcePath)) {
    Write-Error "Il path specificato non esiste: $SourcePath"
    exit 1
}

# Converte il path in formato assoluto
$SourcePath = Resolve-Path -Path $SourcePath

# Definisce le estensioni di file da processare
$TargetExtensions = @('.js', '.json', '.conf', '.md', '.yml', '.yaml','.txt', '.html', '.css', '.ts', '.tsx', '.vue', '.scss', '.less', '.xml', '.properties')

# Lista di esclusione SEMPLIFICATA
$ExcludedFolders = @('.idea', '.gitignore','config_txt','.github', 'node_modules', 'dist', 'build', 'vendor', 'coverage', 'test', 'tests', 'tmp', 'temp')

# Svuota il file di output prima di iniziare
if (Test-Path -Path $OutputFile) {
    Clear-Content -Path $OutputFile
} else {
    New-Item -Path $OutputFile -ItemType File -Force | Out-Null
}

Write-Host "Inizio scansione del path: $SourcePath (Ricorsione: $(!$NoRecurse))" -ForegroundColor Cyan

# Contatori
$ProcessedFiles = 0
$SkippedFiles = 0

try {
    # Ottiene i file in base al flag -NoRecurse
    if ($NoRecurse) {
        $AllFiles = Get-ChildItem -Path $SourcePath -File
    } else {
        $AllFiles = Get-ChildItem -Path $SourcePath -Recurse -File
    }
    
    foreach ($File in $AllFiles) {
        $RelativePath = $File.FullName.Substring($SourcePath.FullName.Length).TrimStart('\')
        if ([string]::IsNullOrEmpty($RelativePath)) { $RelativePath = $File.Name }

        # Verifica se il file è in una cartella esclusa
        $IsExcluded = $false
        $ExclusionReason = ""
        foreach ($ExcludedFolder in $ExcludedFolders) {
            if ($File.DirectoryName -like "*\$ExcludedFolder" -or $File.DirectoryName -like "*\$ExcludedFolder\*") {
                $IsExcluded = $true
                $ExclusionReason = $ExcludedFolder
                break
            }
        }
        
        if ($IsExcluded) {
            Write-Host "🟡 Saltato (In cartella esclusa '$ExclusionReason'): $RelativePath" -ForegroundColor Yellow
            $SkippedFiles++
            continue
        }
        
        # Verifica l'estensione o se è un Dockerfile
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
            
            # <<< MODIFICA: Sostituisce tutti gli "a capo" (Windows e Unix) con uno spazio
            $FileContent = $FileContent -replace "\r?\n", " "
            
            if ([string]::IsNullOrEmpty($FileContent)) {
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
    Write-Host "`n=== STATISTICHE ($SourcePath) ===" -ForegroundColor Green
    Write-Host "File processati: $ProcessedFiles" -ForegroundColor Green
    Write-Host "File saltati: $SkippedFiles" -ForegroundColor Yellow
    Write-Host "Output salvato in: $OutputFile" -ForegroundColor Green
    
} catch {
    Write-Error "Errore durante l'esecuzione dello script: $($_.Exception.Message)"
    exit 1
}

Write-Host "`nCompletato per $SourcePath`n" -ForegroundColor Green