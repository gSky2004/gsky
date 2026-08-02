$ErrorActionPreference = 'Continue'
$root = 'C:\Users\HomePC\Desktop\Gsky-project'
$serverDir = "$root\server"
$clientDir = "$root\client"

Write-Output '== Restarting Gsky servers =='

Write-Output 'Stopping node processes (backend + Vite)...'
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Remove-Item "$serverDir\server.log", "$serverDir\server.err.log" -ErrorAction SilentlyContinue
Remove-Item "$clientDir\vite.log", "$clientDir\vite.err.log" -ErrorAction SilentlyContinue

Write-Output 'Starting backend...'
Start-Process -FilePath 'node' -ArgumentList 'src/server.js' -WorkingDirectory $serverDir `
  -RedirectStandardOutput "$serverDir\server.log" `
  -RedirectStandardError "$serverDir\server.err.log" `
  -WindowStyle Hidden

$backendOk = $false
for ($i = 1; $i -le 20; $i++) {
  Start-Sleep -Seconds 1
  try {
    $r = Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -TimeoutSec 2
    if ($r.status -eq 'ok') { $backendOk = $true; Write-Output "Backend UP after ${i}s"; break }
  } catch { }
}
if (-not $backendOk) {
  Write-Output 'Backend FAILED to start:'
  if (Test-Path "$serverDir\server.err.log") { Get-Content "$serverDir\server.err.log" | Select-Object -Last 15 }
  exit 1
}

Write-Output 'Starting client (Vite)...'
Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -WorkingDirectory $clientDir `
  -RedirectStandardOutput "$clientDir\vite.log" `
  -RedirectStandardError "$clientDir\vite.err.log" `
  -WindowStyle Hidden

$clientOk = $false
for ($i = 1; $i -le 30; $i++) {
  Start-Sleep -Seconds 1
  try {
    $r = Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing -TimeoutSec 2
    if ($r.StatusCode -eq 200) { $clientOk = $true; Write-Output "Client UP after ${i}s"; break }
  } catch { }
}
if (-not $clientOk) {
  Write-Output 'Client FAILED to start:'
  if (Test-Path "$clientDir\vite.err.log") { Get-Content "$clientDir\vite.err.log" | Select-Object -Last 15 }
  exit 1
}

Write-Output 'Both servers are running.'
