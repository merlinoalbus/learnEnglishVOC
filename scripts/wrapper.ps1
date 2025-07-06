# Definisce il percorso della cartella di configurazione
$configFolder = ".\config_txt"

# Definisce l'elenco dei percorsi gestiti separatamente
$specificPaths = @(
    "src\views",
    "src\utils",
    "src\services",
    "src\layouts",
    "src\hooks",
    "src\contexts",
    "src\constants",
    "src\components"
)

# Crea la cartella 'config' se non esiste
if (-not (Test-Path -Path $configFolder -PathType Container)) {
    New-Item -Path $configFolder -ItemType Directory
}

# Cancella tutti i file .txt nella cartella 'config'
Remove-Item -Path "$configFolder\*.txt" -ErrorAction SilentlyContinue

# Esegue gli script di estrazione

# Chiamata alla root, ricorsiva, ma saltando i percorsi specifici
.\extract.ps1 -SourcePath ".\" -OutputFile "$configFolder\root.txt" -PathsToSkip $specificPaths

# Chiamate specifiche
.\extract.ps1 -SourcePath ".\src\views" -OutputFile "$configFolder\views.txt"
.\extract.ps1 -SourcePath ".\src\utils" -OutputFile "$configFolder\utils.txt"
.\extract.ps1 -SourcePath ".\src\services" -OutputFile "$configFolder\services.txt"
.\extract.ps1 -SourcePath ".\src\layouts" -OutputFile "$configFolder\layouts.txt"
.\extract.ps1 -SourcePath ".\src\hooks" -OutputFile "$configFolder\hooks.txt"
.\extract.ps1 -SourcePath ".\src\contexts" -OutputFile "$configFolder\contexts.txt"
.\extract.ps1 -SourcePath ".\src\constants" -OutputFile "$configFolder\constants.txt"
.\extract.ps1 -SourcePath ".\src\components" -OutputFile "$configFolder\components.txt"

Write-Host "Operazione completata! I file di output sono stati creati nella cartella '$configFolder'."