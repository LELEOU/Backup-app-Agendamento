# 🎯 DEPLOY RÁPIDO - 5 MINUTOS

## 🚀 Opção 1: Deploy Automático via Vercel CLI

### **Instalação da Vercel CLI:**

```powershell
npm install -g vercel
```

### **Deploy em 1 Comando:**

```powershell
cd app
vercel
```

Siga o assistente:
- **Set up and deploy?** → Yes
- **Which scope?** → Sua conta
- **Link to existing project?** → No
- **Project name?** → `salao-agendamento` (ou o nome que quiser)
- **Directory?** → `./` (confirme que está em `/app`)
- **Override settings?** → Yes
  - **Build Command:** `npm run build`
  - **Output Directory:** `dist`

**Pronto!** Link do site será exibido! 🎉

---

## 🌐 Opção 2: Deploy via Interface Web (Mais Fácil)

### **Passo 1:** Acesse https://vercel.com/new

### **Passo 2:** Conecte com GitHub
- Clique em **"Continue with GitHub"**
- Autorize a Vercel

### **Passo 3:** Importe o Repositório
- Procure: `LELEOU/Backup-app-Agendamento`
- Clique em **"Import"**

### **Passo 4:** Configure (⚠️ IMPORTANTE)

**Root Directory:**
```
app
```

**Build Settings:** (Clique em "Override")
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### **Passo 5:** Variáveis de Ambiente

Adicione essas 2 variáveis:

| Nome | Valor |
|------|-------|
| `VITE_SUPABASE_URL` | Sua URL do Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sua chave anon do Supabase |

**Onde encontrar:**
1. https://supabase.com/dashboard
2. Seu projeto → Settings → API
3. Copie **Project URL** e **anon public**

### **Passo 6:** Deploy! 🚀

Clique em **"Deploy"** e aguarde 2-3 minutos.

---

## ✅ Teste Após Deploy

Acesse o link fornecido e teste:

- [ ] Página carrega?
- [ ] Consegue fazer login?
- [ ] Consegue criar agendamento?
- [ ] Cores estão corretas?
- [ ] Funciona no celular?

---

## 🆘 Problemas Comuns

### **1. Página em branco**
**Solução:** 
- Verifique se adicionou as variáveis de ambiente
- Redeploy após adicionar

### **2. Erro de build**
**Solução:**
- Confirme que **Root Directory** = `app`
- Teste `npm run build` localmente primeiro

### **3. Login não funciona**
**Solução:**
- Verifique se as URLs do Supabase estão corretas
- Confirme que as variáveis começam com `VITE_`

---

## 📱 Próximo Passo

Depois de testar o site:
- Vamos criar o APK Android
- Sistema completo! 🎉

**Qualquer dúvida, me chama!** 😄
