# 📱 SETUP - Guia de Instalação e Configuração

## 📋 Pré-requisitos

### Windows
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Java JDK 21** - [Download](https://www.oracle.com/java/technologies/downloads/)
- **Android Studio** - [Download](https://developer.android.com/studio)
- **Git** - [Download](https://git-scm.com/)

### Verificar Instalações
```bash
node --version    # deve ser v18 ou superior
npm --version     # deve ser v9 ou superior
java --version    # deve ser 21.x.x
```

---

## 🚀 Instalação do Projeto

### 1. Clone o Repositório
```bash
git clone https://github.com/LELEOU/Backup-app-Agendamento.git
cd Backup-app-Agendamento/app
```

### 2. Instale as Dependências
```bash
npm install
```

Isso instalará:
- Vite
- Tailwind CSS
- Supabase SDK
- Capacitor e plugins
- Todas as dependências necessárias

---

## 🗄️ Configuração do Supabase

### 1. Criar Conta no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta gratuita
3. Crie um novo projeto

### 2. Obter Credenciais
No painel do Supabase:
1. Vá em **Settings** > **API**
2. Copie:
   - **Project URL** (ex: `https://xrpqqgtwomrmcdogyhrz.supabase.co`)
   - **Anon public key** (chave pública)

### 3. Configurar no Projeto
Edite o arquivo `app/src/js/supabase-config.js`:

```javascript
const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co'
const SUPABASE_ANON_KEY = 'SUA-CHAVE-PUBLICA-AQUI'
```

### 4. Criar Tabelas no Banco de Dados
Execute o SQL em **SQL Editor** no Supabase:

```sql
-- Execute o conteúdo do arquivo:
-- app/src/database-setup.sql
```

Isso criará todas as tabelas necessárias (users, clients, services, appointments, etc.)

---

## ⚙️ Configuração do Android

### 1. Instalar Android SDK
1. Abra **Android Studio**
2. Vá em **Tools** > **SDK Manager**
3. Instale:
   - Android SDK Platform 33 (ou superior)
   - Android SDK Build-Tools
   - Android Emulator (opcional, para testes)

### 2. Configurar Variáveis de Ambiente
Adicione ao PATH do Windows:

```
ANDROID_HOME=C:\Users\SeuUsuario\AppData\Local\Android\Sdk
```

E adicione ao PATH:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
```

### 3. Verificar Java 21
Edite `app/android/gradle.properties`:

```properties
org.gradle.java.home=C:\\Program Files\\Java\\jdk-21
```

**⚠️ IMPORTANTE:** Capacitor 7 requer Java 21. Não funciona com Java 17 ou inferior.

---

## 🎨 Personalização (Opcional)

### Alterar Nome do App
Edite `app/capacitor.config.json`:

```json
{
  "appId": "com.seusalao.agendamento",
  "appName": "Nome do Seu Salão",
  ...
}
```

### Alterar Cores
Edite `app/src/css/style.css`:

```css
:root {
    --accent-primary: #8a4fff;   /* Cor principal */
    --accent-secondary: #7a3eee; /* Cor secundária */
}
```

### Substituir Logo
Substitua os arquivos em `app/src/assets/imgs/`:
- `logo.png` - Logo principal
- `NovoS.jpg` - Logo da sidebar
- `icone-de-login.png` - Ícone de login

Depois gere novos ícones do app:
```bash
npx capacitor-assets generate --android
```

---

## 🔨 Build do Projeto

### Modo Desenvolvimento (Web)
```bash
cd app
npm run dev
```

Acesse: http://localhost:5173

### Build para Produção (Web)
```bash
cd app
npm run build
```

Arquivos gerados em: `app/dist/`

### Build Android (APK)
```bash
cd app

# 1. Build da aplicação web
npm run build

# 2. Sincronizar com Android
npx cap sync android

# 3. Entrar na pasta Android
cd android

# 4. Limpar build anterior
.\gradlew.bat clean

# 5. Gerar APK
.\gradlew.bat assembleDebug --no-build-cache --rerun-tasks
```

APK gerado em: `app/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📱 Instalar APK no Celular

### Via USB
1. Ative **Depuração USB** no Android:
   - Configurações > Sobre o telefone
   - Toque 7x em "Número da versão"
   - Volte > Opções do desenvolvedor
   - Ative "Depuração USB"

2. Conecte o celular via USB

3. Execute:
```bash
cd app/android
.\gradlew.bat installDebug
```

### Via Arquivo APK
1. Transfira o APK para o celular
2. Abra o arquivo APK
3. Permita "Instalar de fontes desconhecidas"
4. Instale normalmente

---

## 🍎 Build para iOS (Requer Mac)

**⚠️ ATENÇÃO:** Build iOS só funciona em macOS.

### Pré-requisitos
- macOS 12+
- Xcode 14+
- Conta Apple Developer ($99/ano)

### Passos
```bash
cd app

# Adicionar plataforma iOS
npx cap add ios

# Build
npm run build
npx cap sync ios

# Abrir no Xcode
npx cap open ios
```

No Xcode:
1. Configure Bundle Identifier
2. Configure Team (Apple Developer Account)
3. Product > Archive
4. Distribute > App Store Connect

---

## 🔧 Solução de Problemas

### Erro: "invalid source release: 21"
**Causa:** Java 17 ou inferior instalado
**Solução:** Instale Java 21 e configure `gradle.properties`

### Erro: "SDK location not found"
**Causa:** Android SDK não configurado
**Solução:** Configure `ANDROID_HOME` nas variáveis de ambiente

### Erro: "Supabase não foi carregado"
**Causa:** Credenciais incorretas ou não configuradas
**Solução:** Verifique `supabase-config.js`

### APK fica em tela branca
**Causa:** Arquivos não sincronizados
**Solução:** Execute `npx cap sync android` novamente

### Gradle build lento
**Solução:** Use `--no-build-cache` para forçar rebuild limpo

---

## 📚 Recursos Adicionais

- [Documentação Capacitor](https://capacitorjs.com/docs)
- [Documentação Supabase](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 🆘 Precisa de Ajuda?

Abra uma [issue no GitHub](https://github.com/LELEOU/Backup-app-Agendamento/issues) com:
- Descrição do problema
- Mensagem de erro completa
- Versões (Node, Java, sistema operacional)
- Passos para reproduzir

---

**Próximo passo:** Veja [FEATURES.md](FEATURES.md) para conhecer todas as funcionalidades!
