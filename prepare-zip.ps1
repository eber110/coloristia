# Script de Despliegue Definitivo para Coloristia (Bluehosting/CloudLinux)
# Uso: ./prepare-zip.ps1 (con el servidor local APAGADO)

$root = Get-Location
$desktop = [System.IO.Path]::Combine($env:USERPROFILE, "Desktop")

Write-Host "--- Iniciando preparacion de despliegue ---" -ForegroundColor Cyan

# 1. Generar cliente Prisma con binarios Linux en carpeta propia
Write-Host "`n[1/5] Generando cliente de Prisma (con binarios Linux)..." -ForegroundColor Yellow
Set-Location "$root/server"
npx prisma generate

# 2. Compilar Frontend
Write-Host "`n[2/5] Compilando Frontend (Client)..." -ForegroundColor Yellow
Set-Location "$root/client"
npm install
npm run build

# 3. Compilar Backend
Write-Host "`n[3/5] Compilando Backend (Server)..." -ForegroundColor Yellow
Set-Location "$root/server"
npm install
npm run build

# 4. Crear ZIP del Frontend (incluye .htaccess para React Router)
Write-Host "`n[4/5] Creando ZIP del Frontend..." -ForegroundColor Yellow
$frontendZip = Join-Path $desktop "frontend_public_html.zip"
if (Test-Path $frontendZip) { Remove-Item $frontendZip }
Set-Location "$root/client/dist"
Compress-Archive -Path * -DestinationPath $frontendZip

# 5. Crear ZIP del Backend (SIN node_modules, CON prisma/generated)
Write-Host "`n[5/5] Creando ZIP del Backend (sin node_modules)..." -ForegroundColor Yellow
$backendZip = Join-Path $desktop "backend_coloralia.zip"
if (Test-Path $backendZip) { Remove-Item $backendZip }

$tempBackend = Join-Path $env:TEMP "coloralia_backend"
if (Test-Path $tempBackend) { Remove-Item -Recurse -Force $tempBackend }
New-Item -ItemType Directory -Path $tempBackend | Out-Null

# Copiar archivos del backend
Copy-Item -Path "$root/server/dist"         -Destination $tempBackend -Recurse
Copy-Item -Path "$root/server/prisma"       -Destination $tempBackend -Recurse
Copy-Item -Path "$root/server/package.json" -Destination $tempBackend

# Copiar .env si existe
if (Test-Path "$root/server/.env") {
  Copy-Item -Path "$root/server/.env" -Destination $tempBackend
}

# Crear .npmrc para que npm install NO ejecute scripts de postinstall
# Esto evita que Prisma intente generar en el servidor (que falla por permisos)
Set-Content -Path (Join-Path $tempBackend ".npmrc") -Value "ignore-scripts=true"

# Comprimir
Set-Location $tempBackend
Compress-Archive -Path * -DestinationPath $backendZip

# Limpieza
Set-Location $root
Remove-Item -Recurse -Force $tempBackend

Write-Host "`n--- Proceso Completado! ---" -ForegroundColor Green
Write-Host "`nArchivos en tu Escritorio:" -ForegroundColor Gray
Write-Host "  1. frontend_public_html.zip  -> Subir a public_html" -ForegroundColor White
Write-Host "  2. backend_coloralia.zip     -> Subir a /home/eberstud/coloralia" -ForegroundColor White
Write-Host "`nEn Bluehosting:" -ForegroundColor Cyan
Write-Host "  1. Borra TODO en 'coloralia'" -ForegroundColor Gray
Write-Host "  2. Sube y extrae el nuevo backend ZIP" -ForegroundColor Gray
Write-Host "  3. Verifica el .env (ruta absoluta de DATABASE_URL)" -ForegroundColor Gray
Write-Host "  4. Corre 'Run npm install' en el panel" -ForegroundColor Gray
Write-Host "  5. RESTART" -ForegroundColor Gray
