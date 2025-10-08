# 🔧 Guia: Corrigir Erro do APK (Java 11 Necessário)

## ❌ Problema Atual
```
Dependency requires at least JVM runtime version 11. This build uses a Java 8 JVM.
```

O Gradle 8.7.2 e Android Build Tools requerem **Java 11 ou superior**, mas você está usando **Java 8**.

## ✅ Solução: Instalar Java 11

### Opção 1: Eclipse Temurin (Recomendado)

1. **Baixar Java 11 LTS:**
   - Acesse: https://adoptium.net/temurin/releases/
   - Escolha:
     * Version: **11 - LTS**
     * Operating System: **Windows**
     * Architecture: **x64**
     * Package Type: **JDK**
   - Clique em **Download .msi**

2. **Instalar:**
   - Execute o instalador `.msi`
   - ✅ Marque: **Set JAVA_HOME variable**
   - ✅ Marque: **Add to PATH**
   - ✅ Marque: **JavaSoft (Oracle) registry keys**
   - Clique em **Next** e **Install**

3. **Verificar Instalação:**
   ```powershell
   java -version
   ```
   Deve aparecer algo como:
   ```
   openjdk version "11.0.xx"
   ```

### Opção 2: Oracle JDK 11

1. **Baixar:**
   - https://www.oracle.com/java/technologies/javase/jdk11-archive-downloads.html
   - Escolha: **Windows x64 Installer**

2. **Instalar e configurar JAVA_HOME manualmente:**
   ```powershell
   # Abrir Variáveis de Ambiente:
   # 1. Pressione Win + R
   # 2. Digite: sysdm.cpl
   # 3. Aba "Avançado" → "Variáveis de Ambiente"
   # 4. Em "Variáveis do sistema", clique em "Novo":
   #    - Nome: JAVA_HOME
   #    - Valor: C:\Program Files\Java\jdk-11
   # 5. Edite a variável "Path":
   #    - Adicione: %JAVA_HOME%\bin
   ```

## 🔍 Verificar Configuração

Após instalar, **FECHE e REABRA o PowerShell/Terminal** e execute:

```powershell
# Verificar versão do Java
java -version

# Verificar JAVA_HOME
echo $env:JAVA_HOME

# Verificar se está no PATH
where.exe java
```

## 🚀 Buildar o APK

Depois de configurar o Java 11:

```powershell
cd C:\Users\leona\Desktop\App-de-Agendamento-main\app

# Sincronizar arquivos web com Android
npx cap sync android

# Abrir no Android Studio (para build)
npx cap open android
```

Ou diretamente via linha de comando:

```powershell
cd android
.\gradlew assembleDebug
```

O APK estará em:
```
app/android/app/build/outputs/apk/debug/app-debug.apk
```

## 📱 Instalar no Celular

```powershell
# Conecte o celular via USB (com Depuração USB ativada)
adb install app/android/app/build/outputs/apk/debug/app-debug.apk
```

## 🔥 Troubleshooting

### Problema: Java 8 ainda aparece após instalar Java 11

**Solução:** Remover Java 8 do PATH ou alterar prioridade:

```powershell
# Verificar todas as versões instaladas
where.exe java

# Remover versões antigas do PATH:
# Win + R → sysdm.cpl → Avançado → Variáveis de Ambiente
# Edite "Path" e remova caminhos antigos do Java
```

### Problema: Gradle ainda reclama do Java

**Solução:** Definir JAVA_HOME explicitamente para o projeto:

Edite: `app/android/gradle.properties`

Adicione:
```properties
org.gradle.java.home=C:\\Program Files\\Eclipse Adoptium\\jdk-11.x.x-hotspot
```

(Ajuste o caminho conforme sua instalação)

## 📋 Resumo

1. ✅ **Remover Vite** - Concluído!
2. ✅ **Servidor Node.js funcionando** - http://localhost:3000
3. ⏳ **Instalar Java 11** - Siga este guia
4. ⏳ **Buildar APK** - Após Java 11 configurado

---

**Nota:** Se preferir usar Java 17 ou 21 (LTS mais recentes), funciona perfeitamente também!
