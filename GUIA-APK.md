# 📱 GUIA COMPLETO - APK ANDROID

## 🎯 OBJETIVO: Gerar APK para instalar no celular

---

## ⚙️ PRÉ-REQUISITOS

### **1. Baixar Android Studio**

**Link:** https://developer.android.com/studio

**Tamanho:**
- Download: ~1 GB
- Instalado: ~3-4 GB

**Tempo estimado:** 30-40 minutos

---

## 📥 PASSO A PASSO: INSTALAÇÃO

### **1️⃣ Download**

1. Acesse: https://developer.android.com/studio
2. Clique em **"Download Android Studio"**
3. Aceite os termos
4. Salve o arquivo (`.exe`)

### **2️⃣ Instalação**

1. Execute o arquivo baixado
2. Tela inicial: **Next**
3. Componentes para instalar:
   - ✅ Android Studio
   - ✅ Android SDK
   - ✅ Android Virtual Device
4. **Next** → **Next** → **Install**
5. Aguarde instalação (~10-15 min)
6. **Finish**

### **3️⃣ Primeira Execução**

1. Abra o Android Studio
2. Escolha: **"Do not import settings"**
3. Tela de boas-vindas: **Next**
4. Tipo de instalação: **Standard** → **Next**
5. Tema: Escolha o que preferir → **Next**
6. Verify Settings: **Next**
7. **Finish** → Aguarde download de componentes (~10-20 min)

**⚠️ IMPORTANTE:** Deixe baixar TUDO na primeira vez!

---

## 🔨 GERAR O APK

### **Método 1: Android Studio (Recomendado)**

#### **1️⃣ Abrir Projeto**

```powershell
cd C:\Users\leona\Desktop\App-de-Agendamento-main\app
npx cap open android
```

Isso vai abrir o Android Studio com o projeto.

#### **2️⃣ Aguardar Gradle Sync**

- Na barra inferior, verá: **"Gradle Build Running..."**
- Aguarde finalizar (primeira vez: 5-10 min)
- Quando terminar: **"BUILD SUCCESSFUL"**

#### **3️⃣ Build APK**

1. Menu: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Aguarde (3-5 minutos)
3. Quando aparecer: **"APK(s) generated successfully"**
4. Clique em **"locate"**

#### **4️⃣ APK Gerado!**

Localização:
```
C:\Users\leona\Desktop\App-de-Agendamento-main\app\android\app\build\outputs\apk\debug\app-debug.apk
```

**Este é seu APK!** 📱

---

### **Método 2: Terminal (Mais Rápido)**

Se o Android Studio já estiver instalado:

```powershell
cd C:\Users\leona\Desktop\App-de-Agendamento-main\app\android

# Configurar Java 17
$env:JAVA_HOME="C:\Program Files\Microsoft\jdk-17.0.16.8-hotspot"

# Gerar APK
.\gradlew.bat assembleDebug
```

APK gerado no mesmo local!

---

## 📲 INSTALAR NO CELULAR

### **Método 1: USB (Recomendado)**

#### **1️⃣ Preparar Celular**

1. **Configurações** → **Sobre o telefone**
2. Toque 7x em **"Número da versão"**
3. Modo desenvolvedor ativado! ✅

4. **Configurações** → **Sistema** → **Opções do desenvolvedor**
5. Ative: **"Depuração USB"**

#### **2️⃣ Conectar e Instalar**

```powershell
cd C:\Users\leona\Desktop\App-de-Agendamento-main\app\android
.\gradlew.bat installDebug
```

App instalado direto no celular! 🎉

---

### **Método 2: WhatsApp/Email**

1. Copie o arquivo `app-debug.apk`
2. Envie para você mesmo via WhatsApp/Email
3. No celular, abra o arquivo
4. Se pedir, permita: **"Instalar de fontes desconhecidas"**
5. Instale!

---

## 🎨 PERSONALIZAR

### **Ícone do App**

Substitua as imagens em:
```
app/android/app/src/main/res/
  ├── mipmap-hdpi/ic_launcher.png (72x72)
  ├── mipmap-mdpi/ic_launcher.png (48x48)
  ├── mipmap-xhdpi/ic_launcher.png (96x96)
  ├── mipmap-xxhdpi/ic_launcher.png (144x144)
  └── mipmap-xxxhdpi/ic_launcher.png (192x192)
```

### **Nome do App**

Edite: `app/android/app/src/main/res/values/strings.xml`

```xml
<string name="app_name">Nome do Seu Salão</string>
```

### **Splash Screen**

Edite: `app/android/app/src/main/res/drawable/splash.png`

Tamanho recomendado: 2732x2732px

---

## 🔄 ATUALIZAR APP

Quando fizer mudanças no código:

```powershell
cd app

# 1. Build do código web
npm run build

# 2. Sincronizar com Android
npx cap sync android

# 3. Gerar novo APK
cd android
.\gradlew.bat assembleDebug
```

Novo APK gerado! Redistribua.

---

## 📦 APK ASSINADO (Para produção)

### **Quando usar:**
- Publicar na Play Store
- Distribuição oficial
- Versão final

### **Como fazer:**

#### **1️⃣ Gerar Keystore**

```powershell
cd app\android\app
keytool -genkey -v -keystore salao-agendamento.keystore -alias salao -keyalg RSA -keysize 2048 -validity 10000
```

Preencha os dados e **GUARDE A SENHA!** 🔑

#### **2️⃣ Configurar**

Crie: `app/android/key.properties`

```properties
storePassword=SUA_SENHA
keyPassword=SUA_SENHA
keyAlias=salao
storeFile=salao-agendamento.keystore
```

#### **3️⃣ Gerar APK Release**

```powershell
cd app\android
.\gradlew.bat assembleRelease
```

APK assinado em:
```
app/android/app/build/outputs/apk/release/app-release.apk
```

---

## ✅ CHECKLIST

Antes de distribuir, teste:

- [ ] App abre sem crash?
- [ ] Login funciona?
- [ ] Criar agendamento?
- [ ] Visualizar agenda?
- [ ] Notificações?
- [ ] Modo escuro?
- [ ] Performance boa?

---

## 🐛 PROBLEMAS COMUNS

### **Erro: "SDK location not found"**

**Solução:**
```powershell
# Criar local.properties
echo "sdk.dir=C:\\Users\\leona\\AppData\\Local\\Android\\Sdk" > app\android\local.properties
```

### **Erro: "Gradle build failed"**

**Solução:**
```powershell
cd app\android
.\gradlew.bat clean
.\gradlew.bat assembleDebug
```

### **Erro: "Java version"**

**Solução:**
```powershell
$env:JAVA_HOME="C:\Program Files\Microsoft\jdk-17.0.16.8-hotspot"
```

---

## 📱 DISTRIBUIÇÃO

### **Opção 1: WhatsApp (Grátis)**
- Envie o APK
- Pessoas instalam manualmente
- ✅ Zero custo

### **Opção 2: Google Play Store**
- Custo: $25 USD (única vez)
- App na loja oficial
- Atualizações automáticas
- Mais profissional

---

## 🎯 RESUMO

1. **Instalar Android Studio** (~40 min)
2. **Abrir projeto:** `npx cap open android`
3. **Build APK:** Menu Build → Build APK
4. **Instalar:** Enviar APK via WhatsApp ou USB
5. **PRONTO!** App funcionando! 🎉

---

**CUSTO TOTAL: R$ 0,00** ✅

**Próximo:** Configurar site no seu domínio (depois)

---

**Bora fazer o APK! 💪**
