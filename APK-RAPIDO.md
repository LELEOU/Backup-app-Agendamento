# 🎯 GUIA RÁPIDO - APK Android em 5 Passos

## ⚡ Opção Rápida (Sem Android Studio)

### **Você vai precisar:**
- ✅ Java JDK 17+ instalado
- ✅ Conexão com internet

### **Passo a Passo:**

#### 1️⃣ **Executar o Script Automatizado**

```powershell
cd C:\Users\leona\Desktop\App-de-Agendamento-main
.\gerar-apk.ps1
```

**O script fará automaticamente:**
- ✅ Build da aplicação web
- ✅ Sincronização com Android
- ✅ Geração do APK
- ✅ Mostrará onde o APK foi salvo

#### 2️⃣ **Encontrar o APK**

O APK estará em:
```
C:\Users\leona\Desktop\App-de-Agendamento-main\app\android\app\build\outputs\apk\debug\app-debug.apk
```

#### 3️⃣ **Transferir para o Celular**

**Opções:**
- 📧 Email (envie para você mesmo)
- 💬 WhatsApp (mande para você)
- 📁 Google Drive / Dropbox
- 🔌 Cabo USB (copie direto)

#### 4️⃣ **Instalar no Celular**

1. No celular, abra o arquivo APK
2. Se pedir, ative "Instalar de fontes desconhecidas"
3. Toque em "Instalar"
4. Pronto! 🎉

---

## 🔧 Opção Completa (Com Android Studio)

### **1. Instalar Android Studio**

- Download: https://developer.android.com/studio
- Instale normalmente (Next, Next, Finish)

### **2. Abrir Projeto**

```powershell
cd app
npx cap open android
```

### **3. Aguardar Gradle Sync**

- Barra inferior do Android Studio mostrará progresso
- Primeira vez pode levar 10-15 minutos

### **4. Gerar APK**

No Android Studio:
- **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
- Aguarde alguns minutos
- Clique em **locate** quando aparecer sucesso

---

## ❓ Problemas Comuns

### **Erro: "Java não encontrado"**

**Solução:**
```powershell
# Instale Java JDK 17
winget install Microsoft.OpenJDK.17
```

### **Erro: "ANDROID_HOME not set"**

**Não tem Android Studio?**
- Use o script `gerar-apk.ps1` (funciona sem)

**Tem Android Studio?**
1. Tecla Windows + R → `sysdm.cpl`
2. Avançado → Variáveis de Ambiente
3. Nova variável do sistema:
   - Nome: `ANDROID_HOME`
   - Valor: `C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk`

### **Erro: "Gradle build failed"**

**Solução:**
```powershell
cd app/android
./gradlew clean
./gradlew assembleDebug
```

---

## 📱 Teste do App

Após instalar, teste:

- [ ] App abre sem crash?
- [ ] Consegue fazer login?
- [ ] Consegue criar agendamento?
- [ ] Notificações funcionam?
- [ ] Cores estão corretas?

---

## 🚀 Próxima Atualização

Quando fizer mudanças no código:

```powershell
cd app
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

Ou simplesmente rode:
```powershell
.\gerar-apk.ps1
```

---

## ✨ Pronto para Produção?

Quando o app estiver testado e aprovado:

1. **Google Play Store:**
   - Crie conta ($25 única vez)
   - Siga guia: `ANDROID-NATIVO.md` → Seção "APK Assinado"

2. **Distribuição Privada:**
   - Compartilhe o APK via WhatsApp
   - Mais simples, sem custos!

---

**Qualquer dúvida, me chama! 😄**
