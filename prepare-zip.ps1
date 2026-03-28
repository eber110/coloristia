# Script de Despliegue Robusto para Coloristia (Bluehosting.cl)
# Uso: ./prepare-zip.ps1

$root = Get-Location
$desktop = [System.IO.Path]::Combine($env:USERPROFILE, "Desktop")

Write-Host "--- 🚀 Iniciando preparación de despliegue (Modo Robusto) ---" -ForegroundColor Cyan

# 1. Compilar Frontend
Write-Host "`n[1/4] Compilando Frontend (Client)..." -ForegroundColor Yellow
Set-Location "$root/client"
npm install
npm run build

# 2. Compilar Backend y Generar Prisma
Write-Host "`n[2/4] Compilando Backend y Generando Prisma..." -ForegroundColor Yellow
Set-Location "$root/server"
npm install
npx prisma generate
npm run build

# 3. Crear ZIP del Frontend
Write-Host "`n[3/4] Creando ZIP del Frontend..." -ForegroundColor Yellow
$frontendZip = Join-Path $desktop "frontend_public_html.zip"
if (Test-Path $frontendZip) { Remove-Item $frontendZip }
Set-Location "$root/client/dist"
Compress-Archive -Path * -DestinationPath $frontendZip

# 4. Crear ZIP del Backend (Inyectando Prisma Client)
Write-Host "`n[4/4] Creando ZIP del Backend..." -ForegroundColor Yellow
$backendZip = Join-Path $desktop "backend_coloralia.zip"
if (Test-Path $backendZip) { Remove-Item $backendZip }

$tempBackend = Join-Path $env:TEMP "coloralia_final"
if (Test-Path $tempBackend) { Remove-Item -Recurse -Force $tempBackend }
New-Item -ItemType Directory -Path $tempBackend | Out-Null

# Copiar archivos base
Copy-Item -Path "$root/server/dist" -Destination $tempBackend -Recurse
Copy-Item -Path "$root/server/prisma" -Destination $tempBackend -Recurse
Copy-Item -Path "$root/server/package.json" -Destination $tempBackend
if (Test-Path "$root/server/.env") { Copy-Item -Path "$root/server/.env" -Destination $tempBackend }

# INYECTAR PRISMA: Copiamos solo lo necesario de node_modules para que funcione sin 'generate' en el server
$destNodeModules = New-Item -ItemType Directory -Path (Join-Path $tempBackend "node_modules")
Copy-Item -Path "$root/server/node_modules/@prisma" -Destination $destNodeModules -Recurse
Copy-Item -Path "$root/server/node_modules/.prisma" -Destination $destNodeModules -Recurse

# Comprimir todo el backend
Set-Location $tempBackend
Compress-Archive -Path * -DestinationPath $backendZip

# Limpieza
Set-Location $root
Remove-Item -Recurse -Force $tempBackend

Write-Host "`n--- ✅ ¡Proyecto Restaurado y Listo! ---" -ForegroundColor Green
Write-Host "Archivos en tu Escritorio:" -ForegroundColor Gray
Write-Host "1. frontend_public_html.zip" -ForegroundColor White
Write-Host "2. backend_coloralia.zip" -ForegroundColor White
Write-Host "`nPasos finales:" -ForegroundColor Cyan
Write-Host "1. Borra TODO en 'coloralia' del servidor." -ForegroundColor Gray
Write-Host "2. Sube y extrae el nuevo ZIP." -ForegroundColor Gray
Write-Host "3. Ajusta la ruta absoluta en el .env del servidor." -ForegroundColor Gray
Write-Host "4. Dale a RESTART." -ForegroundColor Gray
