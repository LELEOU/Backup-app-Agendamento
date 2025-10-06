# 📱 App Nativo Android - Guia Completo

## ✅ Status Atual
- [x] Capacitor instalado
- [x] Projeto Android criado em `app/android/`
- [x] Build web funcionando
- [x] Plugins configurados (Camera, SplashScreen)

---

## 🔧 Pré-requisitos

### **1. Instalar Android Studio**

**Download:** https://developer.android.com/studio

**Durante a instalação:**
- ✅ Marque "Android SDK"
- ✅ Marque "Android SDK Platform"
- ✅ Marque "Android Virtual Device"

**Após instalar:**
1. Abra o Android Studio
2. Vá em **More Actions** → **SDK Manager**
3. Na aba **SDK Platforms**, marque:
   - ✅ Android 13.0 (Tiramisu) - API 33
   - ✅ Android 12.0 (S) - API 31
4. Na aba **SDK Tools**, marque:
   - ✅ Android SDK Build-Tools
   - ✅ Android SDK Command-line Tools
   - ✅ Android Emulator
5. Clique em **Apply** → **OK**

### **2. Configurar Variáveis de Ambiente (Windows)**

**Adicionar ao PATH:**

1. Aperte `Windows + R` → digite `sysdm.cpl` → Enter
2. Vá em **Avançado** → **Variáveis de Ambiente**
3. Em **Variáveis do sistema**, encontre `Path` → **Editar**
4. Adicione (ajuste o caminho se necessário):
   ```
   C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk\platform-tools
   C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk\tools
   ```

5. Crie nova variável `ANDROID_HOME`:
   - Nome: `ANDROID_HOME`
   - Valor: `C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk`

6. Reinicie o PowerShell

---

## 🚀 Gerar APK de Produção

### **Método 1: Via Android Studio (Recomendado)**

1. **Abrir Projeto:**
   ```powershell
   cd C:\Users\leona\Desktop\App-de-Agendamento-main\app
   npx cap open android
   ```

2. **No Android Studio:**
   - Aguarde o Gradle sincronizar (barra inferior)
   - Vá em **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - Aguarde 5-10 minutos
   - Clique em **locate** quando aparecer "APK(s) generated successfully"

3. **APK gerado em:**
   ```
   app/android/app/build/outputs/apk/debug/app-debug.apk
   ```

### **Método 2: Via Terminal (Mais Rápido)**

```powershell
cd app/android
./gradlew assembleDebug
```

**APK gerado:**
```
app/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📦 APK Assinado para Produção

### **1. Gerar Keystore (Chave de Assinatura)**

```powershell
cd app/android/app
keytool -genkey -v -keystore salao-agendamento.keystore -alias salao -keyalg RSA -keysize 2048 -validity 10000
```

**Preencha:**
- Senha: `(escolha uma senha forte e GUARDE!)`
- Nome: Seu Nome
- Unidade: Salão
- Organização: Seu Salão
- Cidade: Sua Cidade
- Estado: Seu Estado
- País: BR

### **2. Configurar Gradle**

Crie: `app/android/key.properties`

```properties
storePassword=SUA_SENHA_AQUI
keyPassword=SUA_SENHA_AQUI
keyAlias=salao
storeFile=salao-agendamento.keystore
```

⚠️ **IMPORTANTE:** Adicione ao `.gitignore`:
```
key.properties
*.keystore
```

### **3. Editar `app/android/app/build.gradle`**

Adicione antes de `android {`:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Dentro de `android {`, adicione:

```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### **4. Gerar APK Release**

```powershell
cd app/android
./gradlew assembleRelease
```

**APK assinado:**
```
app/android/app/build/outputs/apk/release/app-release.apk
```

---

## 📲 Instalar no Celular

### **Método 1: USB (Recomendado)**

1. **Habilitar modo desenvolvedor no celular:**
   - Configurações → Sobre o telefone
   - Toque 7x em "Número da versão"

2. **Ativar depuração USB:**
   - Configurações → Opções do desenvolvedor
   - Ative "Depuração USB"

3. **Conectar celular no PC via USB**

4. **Instalar:**
   ```powershell
   cd app/android
   ./gradlew installDebug
   ```

### **Método 2: Transferir APK**

1. Copie o APK para o celular (WhatsApp, Email, etc)
2. No celular, abra o APK
3. Permita "Instalar de fontes desconhecidas"
4. Instale!

---

## 🎨 Personalizar Ícone e Splash Screen

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

### **Splash Screen**

Edite:
```
app/android/app/src/main/res/drawable/splash.png
```

Recomendado: 2732x2732px (PNG)

---

## 🔧 Atualizar App Após Mudanças no Código

Sempre que alterar o código web:

```powershell
cd app
npm run build
npx cap sync android
```

Depois rebuild o APK.

---

## ✅ Checklist de Testes

Antes de distribuir:

- [ ] App abre sem crash?
- [ ] Login funciona?
- [ ] Criar agendamento funciona?
- [ ] Notificações aparecem?
- [ ] Câmera funciona (para fotos de perfil)?
- [ ] Funciona offline (cache)?
- [ ] Modo escuro funciona?
- [ ] Performance está boa?

---

## 🐛 Problemas Comuns

### **Erro: SDK not found**
```powershell
# Configure ANDROID_HOME
set ANDROID_HOME=C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk
```

### **Erro: Gradle build failed**
- Verifique internet (Gradle baixa dependências)
- Limpe cache: `./gradlew clean`

### **App instalado mas não abre**
- Verifique logs: `adb logcat`
- Reconstrua: `npm run build && npx cap sync`

---

## 📱 Próximos Passos

### **Opção 1: Google Play Store**
1. Criar conta Google Play Console ($25 única vez)
2. Upload do APK release
3. Preencher listagem da loja
4. Publicar!

### **Opção 2: Distribuição Direta**
1. Compartilhe o APK via WhatsApp/Drive
2. Usuários instalam manualmente
3. Mais simples, sem custos!

---

## 🆘 Precisa de Ajuda?

Qualquer erro, me avise:
1. Copie a mensagem de erro completa
2. Me mande aqui no chat
3. Vamos resolver! 💪

**Bora criar o app! 🚀**
