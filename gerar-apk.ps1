# 🚀 Script para Gerar APK - Automatizado

# IMPORTANTE: Execute este script no PowerShell
# Navegue até a pasta do projeto antes de executar

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📱 Gerador de APK - Salão Agendamento" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Passo 1: Build do projeto web
Write-Host "⚙️  Passo 1/4: Fazendo build da aplicação web..." -ForegroundColor Yellow
cd app
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build! Verifique os erros acima." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
Write-Host ""

# Passo 2: Sincronizar com Android
Write-Host "⚙️  Passo 2/4: Sincronizando arquivos com projeto Android..." -ForegroundColor Yellow
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao sincronizar! Verifique os erros acima." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Sincronização concluída!" -ForegroundColor Green
Write-Host ""

# Passo 3: Gerar APK
Write-Host "⚙️  Passo 3/4: Gerando APK de debug..." -ForegroundColor Yellow
Write-Host "⏳ Isso pode levar alguns minutos na primeira vez..." -ForegroundColor Yellow
cd android
./gradlew assembleDebug

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao gerar APK! Verifique os erros acima." -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Possíveis soluções:" -ForegroundColor Yellow
    Write-Host "   1. Verifique se o Android SDK está instalado" -ForegroundColor White
    Write-Host "   2. Verifique a variável ANDROID_HOME" -ForegroundColor White
    Write-Host "   3. Tente limpar: ./gradlew clean" -ForegroundColor White
    exit 1
}

Write-Host "✅ APK gerado com sucesso!" -ForegroundColor Green
Write-Host ""

# Passo 4: Localizar APK
$apkPath = "app\build\outputs\apk\debug\app-debug.apk"
$fullPath = Resolve-Path $apkPath -ErrorAction SilentlyContinue

Write-Host "========================================" -ForegroundColor Green
Write-Host "🎉 SUCESSO! APK GERADO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Localização do APK:" -ForegroundColor Cyan
Write-Host $fullPath -ForegroundColor White
Write-Host ""
Write-Host "📲 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Copie o APK para seu celular" -ForegroundColor White
Write-Host "   2. Ative 'Fontes desconhecidas' nas configurações" -ForegroundColor White
Write-Host "   3. Abra o APK no celular e instale" -ForegroundColor White
Write-Host ""
Write-Host "💡 Ou conecte o celular via USB e execute:" -ForegroundColor Yellow
Write-Host "   ./gradlew installDebug" -ForegroundColor White
Write-Host ""
Write-Host "✨ App pronto para usar! ✨" -ForegroundColor Green
