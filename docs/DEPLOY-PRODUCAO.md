# 🚀 GUIA DE DEPLOY PARA PRODUÇÃO

**Versão:** 1.0.0  
**Última atualização:** 06/01/2025

---

## 📋 PRÉ-REQUISITOS

Antes de fazer deploy, certifique-se de que:

- [x] ✅ Tailwind CSS migrado de CDN para npm
- [ ] ⏳ Banco de dados Supabase configurado
- [ ] ⏳ Variáveis de ambiente prontas
- [ ] ⏳ Build de produção testado localmente

---

## 🌐 OPÇÕES DE DEPLOY

### **Opção 1: Vercel (Recomendado)** ⭐

**Vantagens:**
- ✅ HTTPS automático
- ✅ Deploy contínuo (CI/CD)
- ✅ Edge Network global
- ✅ Free tier generoso

**Passo a passo:**

1. **Criar conta no Vercel**
   ```bash
   npm i -g vercel
   vercel login
   ```

2. **Fazer deploy**
   ```bash
   cd app
   vercel --prod
   ```

3. **Configurar variáveis de ambiente**
   - Acesse dashboard do Vercel
   - Vá em Settings > Environment Variables
   - Adicione:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_APP_TITLE`
     - `VITE_APP_VERSION`

4. **Configurar build**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Deploy automático**
   - Conecte ao GitHub
   - Cada push na branch `main` = deploy automático

---

### **Opção 2: Netlify** 🌟

**Vantagens:**
- ✅ Interface amigável
- ✅ HTTPS automático
- ✅ Suporte PWA excelente

**Passo a passo:**

1. **Criar conta no Netlify**
   - Acesse: https://netlify.com

2. **Conectar repositório GitHub**
   - New site from Git
   - Escolher: `Backup-app-Agendamento`

3. **Configurar build**
   - Base directory: `app`
   - Build command: `npm run build`
   - Publish directory: `app/dist`

4. **Adicionar variáveis de ambiente**
   - Site settings > Environment variables
   - Adicionar todas as variáveis do `.env.example`

5. **Deploy**
   - Netlify faz deploy automaticamente

---

### **Opção 3: GitHub Pages** 🐙

**Limitações:**
- ⚠️ Apenas sites estáticos
- ⚠️ Requer configuração manual de HTTPS

**Passo a passo:**

1. **Instalar gh-pages**
   ```bash
   cd app
   npm install -D gh-pages
   ```

2. **Adicionar scripts no package.json**
   ```json
   {
     "scripts": {
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Build e deploy**
   ```bash
   npm run build
   npm run deploy
   ```

---

## 🔧 CONFIGURAÇÃO DO SUPABASE PARA PRODUÇÃO

### 1. **Configurar URLs permitidas**

No dashboard do Supabase:
- Authentication > URL Configuration
- Adicionar:
  - Site URL: `https://seu-dominio-producao.com`
  - Redirect URLs: `https://seu-dominio-producao.com/**`

### 2. **Configurar RLS (Row Level Security)**

Verificar se todas as políticas estão ativas:
```sql
-- Verificar RLS ativo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 3. **Backup do banco**

Antes de ir para produção:
- Dashboard > Database > Backups
- Criar backup manual
- Configurar backups automáticos

---

## ✅ CHECKLIST DE PRODUÇÃO

### Antes do Deploy

- [ ] ✅ Build funciona: `npm run build`
- [ ] ✅ Sem erros no console
- [ ] ✅ Tailwind CSS processado corretamente
- [ ] ✅ Service Worker configurado
- [ ] ✅ manifest.json válido
- [ ] ✅ Ícones PWA em todos os tamanhos
- [ ] ✅ .env.example documentado
- [ ] ✅ .env NÃO está no Git

### Configuração Supabase

- [ ] ✅ Tabelas criadas (`database-setup.sql`)
- [ ] ✅ RLS ativo em todas as tabelas
- [ ] ✅ Políticas de segurança configuradas
- [ ] ✅ URLs de produção cadastradas
- [ ] ✅ Backup do banco feito

### Teste em Produção

- [ ] ⏳ HTTPS funcionando
- [ ] ⏳ Service Worker ativo
- [ ] ⏳ Login funciona
- [ ] ⏳ Criar agendamento funciona
- [ ] ⏳ Slots múltiplos funcionam
- [ ] ⏳ Sistema de pausas funciona
- [ ] ⏳ Comissões calculam
- [ ] ⏳ Notificações aparecem
- [ ] ⏳ PWA instalável no celular
- [ ] ⏳ Funciona offline

---

## 🔒 SEGURANÇA

### Variáveis de Ambiente

**NUNCA commite:**
- ❌ `.env`
- ❌ Credenciais do Supabase
- ❌ Chaves de API

**Sempre use:**
- ✅ `.env.example` (sem valores reais)
- ✅ Variáveis de ambiente na plataforma de deploy
- ✅ `.gitignore` configurado

### HTTPS

- ✅ **OBRIGATÓRIO** para produção
- ✅ Service Worker só funciona com HTTPS
- ✅ Vercel/Netlify fornecem automaticamente

---

## 📊 MONITORAMENTO

### Logs do Supabase

- Database > Logs
- Monitorar queries lentas
- Verificar erros de autenticação

### Analytics (Opcional)

Adicionar Google Analytics:
```html
<!-- Em index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
```

---

## 🐛 TROUBLESHOOTING

### Build falha

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

### Service Worker não funciona

- ✅ Verificar se está em HTTPS
- ✅ Verificar console do navegador
- ✅ Limpar cache: DevTools > Application > Clear storage

### Notificações não aparecem

- ✅ Verificar permissões do navegador
- ✅ Testar em HTTPS
- ✅ Ver console para erros

---

## 📞 SUPORTE

- 📚 Documentação: [`docs/`](../docs/)
- 🐛 Reportar bug: [GitHub Issues](https://github.com/LELEOU/Backup-app-Agendamento/issues)
- 💬 Discussões: [GitHub Discussions](https://github.com/LELEOU/Backup-app-Agendamento/discussions)

---

**Próximo passo:** [Preparar App Nativo com Capacitor](../docs/GUIA-MOBILE-DEVELOPMENT.md)
