# start.ps1
Write-Host "🚀 Démarrage de Sparkle Movie (PowerShell)..." -ForegroundColor Cyan

# 1. Démarrage du Backend
Write-Host "📡 Lancement du Backend (FastAPI) sur http://localhost:8000..." -ForegroundColor Yellow
# On utilise Start-Process pour lancer en arrière-plan dans la même fenêtre
Start-Job -Name "SparkleBackend" -ScriptBlock {
    cd $using:PSScriptRoot
    & .\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
}

# Attendre que le backend s'initialise
Start-Sleep -Seconds 3

# 2. Démarrage du Frontend
Write-Host "💻 Lancement du Frontend (Vite) sur http://localhost:5173..." -ForegroundColor Green
Start-Job -Name "SparkleFrontend" -ScriptBlock {
    cd "$using:PSScriptRoot\frontend"
    npm run dev
}

Write-Host "✨ Serveurs lancés !" -ForegroundColor Green
Write-Host "👉 Backend : http://localhost:8000"
Write-Host "👉 Frontend : http://localhost:5173"
Write-Host ""
Write-Host "Pour voir les logs : Receive-Job -Name SparkleBackend -Keep"
Write-Host "Pour arrêter : Get-Job | Stop-Job"

# Garder la fenêtre ouverte et afficher les logs du frontend par défaut
Receive-Job -Name SparkleFrontend -AutoRemoveJob -Wait
