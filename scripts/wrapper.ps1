# =====================================================
# scripts/wrapper.ps1 - WRAPPER ORCHESTRATOR CLEAN
# =====================================================

# CARTELLA OUTPUT
$configFolder = ".\..\config_txt"

# PERCORSI SPECIFICI DA GESTIRE SEPARATAMENTE
$specificPaths = @(
    "..\src\components",
    "..\src\config", 
    "..\src\contexts",
    "..\src\hooks",
    "..\src\layouts",
    "..\src\manager",
    "..\src\routing",
    "..\src\services",
    "..\src\styles",
    "..\src\types",
    "..\src\utils",
    "..\src\views"
)

# =====================================================
# PREPARAZIONE AMBIENTE
# =====================================================

if (-not (Test-Path -Path $configFolder -PathType Container)) {
    New-Item -Path $configFolder -ItemType Directory
    Write-Host "Cartella output creata: $configFolder" -ForegroundColor Green
} else {
    Write-Host "Cartella output esistente: $configFolder" -ForegroundColor Yellow
}

Remove-Item -Path "$configFolder\*.txt" -ErrorAction SilentlyContinue
Write-Host "File .txt precedenti rimossi" -ForegroundColor Cyan

# =====================================================
# ESTRAZIONE ROOT
# =====================================================

Write-Host ""
Write-Host "FASE 1: Estrazione ROOT (configurazione, Docker, package.json, etc.)" -ForegroundColor Magenta

.\extract.ps1 -SourcePath ".\..\" -OutputFile "$configFolder\root.txt" -PathsToSkip $specificPaths

Write-Host "ROOT extraction completata -> root.txt" -ForegroundColor Green

# =====================================================
# ESTRAZIONI SPECIFICHE PER CARTELLA
# =====================================================

Write-Host ""
Write-Host "FASE 2: Estrazioni specifiche per tipologia" -ForegroundColor Magenta

# COMPONENTS
Write-Host "Estraendo COMPONENTS..." -ForegroundColor Blue
.\extract.ps1 -SourcePath ".\..\src\components" -OutputFile "$configFolder\components.txt"
Write-Host "COMPONENTS extraction completata -> components.txt" -ForegroundColor Green

# CONFIG
Write-Host "Estraendo CONFIG..." -ForegroundColor Blue
.\extract.ps1 -SourcePath ".\..\src\config" -OutputFile "$configFolder\config.txt"
Write-Host "CONFIG extraction completata -> config.txt" -ForegroundColor Green

# CONTEXTS
Write-Host "Estraendo CONTEXTS..." -ForegroundColor Blue
.\extract.ps1 -SourcePath ".\..\src\contexts" -OutputFile "$configFolder\contexts.txt"
Write-Host "CONTEXTS extraction completata -> contexts.txt" -ForegroundColor Green

# HOOKS
Write-Host "Estraendo HOOKS..." -ForegroundColor Blue
.\extract.ps1 -SourcePath ".\..\src\hooks" -OutputFile "$configFolder\hooks.txt"
Write-Host "HOOKS extraction completata -> hooks.txt" -ForegroundColor Green

# LAYOUTS
Write-Host "Estraendo LAYOUTS..." -ForegroundColor Blue
.\extract.ps1 -SourcePath ".\..\src\layouts" -OutputFile "$configFolder\layouts.txt"
Write-Host "LAYOUTS extraction completata -> layouts.txt" -ForegroundColor Green

# MANAGER
Write-Host "Estraendo MANAGER..." -ForegroundColor Blue
.\extract.ps1 -SourcePath ".\..\src\manager" -OutputFile "$configFolder\manager.txt"
Write-Host "MANAGER extraction completata -> manager.txt" -ForegroundColor Green

# ROUTING
Write-Host "Estraendo ROUTING..." -ForegroundColor Blue
.\extract.ps1 -SourcePath ".\..\src\routing" -OutputFile "$configFolder\routing.txt"
Write-Host "ROUTING extraction completata -> routing.txt" -ForegroundColor Green

# SERVICES
Write-Host "Estraendo SERVICES..." -ForegroundColor Blue
.\extract.ps1 -SourcePath ".\..\src\services" -OutputFile "$configFolder\services.txt"
Write-Host "SERVICES extraction completata -> services.txt" -ForegroundColor Green

# STYLES
Write-Host "Estraendo STYLES..." -ForegroundColor Blue
.\extract.ps1 -SourcePath ".\..\src\styles" -OutputFile "$configFolder\styles.txt"
Write-Host "STYLES extraction completata -> styles.txt" -ForegroundColor Green

# TYPES
Write-Host "Estraendo TYPES..." -ForegroundColor Blue
.\extract.ps1 -SourcePath ".\..\src\types" -OutputFile "$configFolder\types.txt"
Write-Host "TYPES extraction completata -> types.txt" -ForegroundColor Green

# UTILS
Write-Host "Estraendo UTILS..." -ForegroundColor Blue
.\extract.ps1 -SourcePath ".\..\src\utils" -OutputFile "$configFolder\utils.txt"
Write-Host "UTILS extraction completata -> utils.txt" -ForegroundColor Green

# VIEWS
Write-Host "Estraendo VIEWS..." -ForegroundColor Blue
.\extract.ps1 -SourcePath ".\..\src\views" -OutputFile "$configFolder\views.txt"
Write-Host "VIEWS extraction completata -> views.txt" -ForegroundColor Green

# =====================================================
# MESSAGGIO DI COMPLETAMENTO
# =====================================================

Write-Host ""
Write-Host "OPERAZIONE COMPLETATA CON SUCCESSO!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green

# STATISTICHE
$fileCount = (Get-ChildItem -Path $configFolder -Filter "*.txt").Count
$totalSize = (Get-ChildItem -Path $configFolder -Filter "*.txt" | Measure-Object -Property Length -Sum).Sum
$totalSizeKB = [math]::Round($totalSize / 1KB, 2)

Write-Host ""
Write-Host "STATISTICHE:" -ForegroundColor Yellow
Write-Host "   File creati: $fileCount" -ForegroundColor White
Write-Host "   Dimensione totale: $totalSizeKB KB" -ForegroundColor White