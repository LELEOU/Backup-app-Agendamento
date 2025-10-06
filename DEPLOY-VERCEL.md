# 🚀 Deploy na Vercel - Guia Completo

## ✅ Pré-requisitos Concluídos
- [x] Tailwind CSS instalado via npm
- [x] Build funcionando (`npm run build`)
- [x] Variáveis de ambiente documentadas
- [x] Coluna `duration` adicionada no Supabase
- [x] Código versionado no Git

---

## 📋 Passo a Passo para Deploy

### **1️⃣ Criar Conta na Vercel**

1. Acesse: https://vercel.com/signup
2. Clique em **"Continue with GitHub"**
3. Autorize a Vercel a acessar seus repositórios

### **2️⃣ Importar o Projeto**

1. No dashboard da Vercel, clique em **"Add New Project"**
2. Procure por: `LELEOU/Backup-app-Agendamento`
3. Clique em **"Import"**

### **3️⃣ Configurar o Projeto**

**Build Settings:**
- **Framework Preset:** Vite
- **Root Directory:** `app`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

**⚠️ IMPORTANTE:** Clique em **"Override"** para configurar manualmente!

### **4️⃣ Adicionar Variáveis de Ambiente**

Na seção **"Environment Variables"**, adicione:

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

**Onde encontrar essas informações:**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

### **5️⃣ Deploy! 🚀**

1. Clique em **"Deploy"**
2. Aguarde 2-3 minutos (a Vercel vai buildar tudo)
3. Pronto! Você terá um link tipo: `https://backup-app-agendamento.vercel.app`

---

## 🔧 Configurações Opcionais

### **Domínio Personalizado**

Se quiser usar `salao.com.br`:

1. No dashboard do projeto, vá em **"Settings"** → **"Domains"**
2. Adicione seu domínio
3. Configure o DNS conforme instruções

### **Proteção de Senha (Opcional)**

Se quiser proteger o site com senha:

1. Vá em **"Settings"** → **"General"**
2. Ative **"Password Protection"**
3. Defina uma senha

---

## ✅ Checklist Pós-Deploy

Depois do deploy, teste:

- [ ] Login funciona?
- [ ] Criar agendamento (30, 45, 60 min)?
- [ ] Visualizar agenda?
- [ ] Criar cliente?
- [ ] Notificações aparecem?
- [ ] Modo escuro funciona?
- [ ] Funciona no celular?

---

## 🐛 Resolução de Problemas

### **Erro: "Build Failed"**
- Verifique se o **Root Directory** está como `app`
- Confirme que `npm run build` funciona localmente

### **Erro: "Environment Variables Missing"**
- Adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- **Redeploy** após adicionar as variáveis

### **Página em branco após deploy**
- Verifique o console do navegador (F12)
- Confirme que as variáveis de ambiente estão corretas
- Verifique se o Supabase está online

---

## 📱 Próximo Passo: App Nativo

Depois de testar o deploy web:
- Vamos criar o APK para Android
- Instalar no celular das manicures
- App completo e profissional! 🎉

---

## 🆘 Precisa de Ajuda?

Se tiver qualquer problema:
1. Copie a mensagem de erro
2. Me avise aqui no chat
3. Vamos resolver juntos!

**Bora colocar o sistema online! 🚀**
