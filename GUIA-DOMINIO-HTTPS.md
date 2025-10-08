# 🌐 Guia Completo: Configuração de Domínio e HTTPS

## 📋 Índice
1. [Registrar Domínio](#1-registrar-domínio)
2. [Escolher Hospedagem](#2-escolher-hospedagem)
3. [Configurar DNS](#3-configurar-dns)
4. [Deploy da Aplicação](#4-deploy-da-aplicação)
5. [Configurar HTTPS (SSL/TLS)](#5-configurar-https-ssltls)
6. [Configurar Supabase](#6-configurar-supabase)
7. [Manutenção e Monitoramento](#7-manutenção-e-monitoramento)

---

## 1. Registrar Domínio

### Opções de Registro (Brasil)

**Registro.br (Nacional - Recomendado para .br)**
- Site: https://registro.br/
- Custo: ~R$ 40/ano (.com.br)
- Vantagens: Mais barato para domínios .br, suporte em português

**Namecheap (Internacional)**
- Site: https://www.namecheap.com/
- Custo: ~$10/ano (.com)
- Vantagens: Preço baixo, interface simples

**GoDaddy**
- Site: https://www.godaddy.com/pt-br
- Custo: ~R$ 50-80/ano
- Vantagens: Conhecido, suporte 24/7

### Exemplos de Nomes:
```
salaoneilavargas.com.br
agendaneila.com.br
estudioneila.com.br
neila.studio
```

---

## 2. Escolher Hospedagem

### Opção A: Vercel (Recomendado - MAIS FÁCIL) ⭐

**Vantagens:**
- ✅ **100% Grátis** para projetos pessoais
- ✅ **HTTPS automático** (não precisa configurar nada!)
- ✅ **Deploy em 2 minutos**
- ✅ **Domínio customizado grátis**
- ✅ **Atualização automática via Git**

**Passos:**

1. **Criar conta:** https://vercel.com/signup
2. **Conectar GitHub:**
   - Clique em "Import Project"
   - Selecione seu repositório: `Backup-app-Agendamento`
3. **Configurar Build:**
   ```
   Framework Preset: Other
   Build Command: npm run build
   Output Directory: app/src
   Install Command: npm install
   ```
4. **Deploy:**
   - Clique em "Deploy"
   - Aguarde ~1 minuto
   - Seu site estará online em: `https://seu-app.vercel.app`

5. **Adicionar Domínio Customizado:**
   - Vá em "Settings" → "Domains"
   - Digite: `salaoneilavargas.com.br`
   - Copie os registros DNS que aparecerem
   - Adicione no painel do Registro.br (veja seção 3)

---

### Opção B: Netlify (Alternativa - Também Fácil)

**Similar ao Vercel:**
- Site: https://netlify.com
- HTTPS automático
- Deploy via Git
- Domínio customizado grátis

**Configuração:**
```
Build command: npm run build
Publish directory: app/src
```

---

### Opção C: VPS (Avançado - Mais Controle)

**Provedores:**
- **DigitalOcean:** $4-6/mês (https://digitalocean.com)
- **Vultr:** $3.50/mês (https://vultr.com)
- **Contabo:** €4/mês (https://contabo.com)

**Quando usar:**
- Se precisar rodar banco de dados próprio
- Se quiser controle total do servidor
- Se tiver conhecimento técnico

---

## 3. Configurar DNS

### No Registro.br (se comprou domínio .br)

1. **Acessar:** https://registro.br/
2. **Login** → Painel de Controle
3. **Selecionar domínio** → "Editar zona DNS"
4. **Adicionar registros:**

#### Para Vercel/Netlify:
```
Tipo: A
Nome: @
Valor: (IP fornecido pela plataforma)
TTL: 3600

Tipo: CNAME
Nome: www
Valor: cname.vercel-dns.com (ou similar fornecido)
TTL: 3600
```

#### Exemplo Vercel Completo:
```
A     @       76.76.21.21
CNAME www     cname.vercel-dns.com
TXT   @       "vercel-domain-verification=abc123..."
```

---

### No Namecheap/GoDaddy

1. **Dashboard** → Seu domínio → "DNS Management"
2. **Adicionar registros** (mesmo formato acima)

---

## 4. Deploy da Aplicação

### Deploy no Vercel (Passo a Passo Detalhado)

#### 4.1. Preparar o Projeto

```powershell
# Na raiz do projeto
cd C:\Users\leona\Desktop\App-de-Agendamento-main

# Certifique-se que está tudo commitado
git status
git add .
git commit -m "Preparando para deploy Vercel"
git push origin main
```

#### 4.2. Criar arquivo vercel.json

Crie na **raiz do projeto**:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "app/src/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/app/src/$1"
    }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    }
  ]
}
```

#### 4.3. Deploy

```powershell
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Ou simplesmente:
1. Acesse https://vercel.com
2. Clique "Import Project"
3. Selecione o repositório GitHub
4. Clique "Deploy"

---

### Deploy em VPS (Avançado)

#### 4.1. Conectar ao Servidor

```bash
ssh root@seu-servidor-ip
```

#### 4.2. Instalar Dependências

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Instalar Nginx
apt install -y nginx

# Instalar Certbot (para SSL)
apt install -y certbot python3-certbot-nginx
```

#### 4.3. Clonar Projeto

```bash
cd /var/www
git clone https://github.com/LELEOU/Backup-app-Agendamento.git
cd Backup-app-Agendamento

# Instalar dependências
npm install
cd app && npm install && cd ..
```

#### 4.4. Configurar Nginx

Criar arquivo: `/etc/nginx/sites-available/salao`

```nginx
server {
    listen 80;
    server_name salaoneilavargas.com.br www.salaoneilavargas.com.br;

    root /var/www/Backup-app-Agendamento/app/src;
    index index.html;

    # Compressão GZIP
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_comp_level 6;

    # Cache de assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA - redirecionar tudo para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Service Worker
    location /sw.js {
        add_header Service-Worker-Allowed "/";
        add_header Cache-Control "no-cache";
    }
}
```

Ativar site:
```bash
ln -s /etc/nginx/sites-available/salao /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 5. Configurar HTTPS (SSL/TLS)

### Opção A: Vercel/Netlify (Automático) ⭐

**Não precisa fazer NADA!** 🎉

O HTTPS é configurado automaticamente assim que você adicionar o domínio customizado.

---

### Opção B: Let's Encrypt (VPS - Grátis)

```bash
# Gerar certificado SSL (automático)
certbot --nginx -d salaoneilavargas.com.br -d www.salaoneilavargas.com.br

# Seguir instruções:
# 1. Digite seu email
# 2. Aceite os termos (Y)
# 3. Escolha redirecionar HTTP → HTTPS (opção 2)
```

**Pronto!** Certificado válido por 90 dias (renova automaticamente).

Testar renovação:
```bash
certbot renew --dry-run
```

---

### Opção C: Cloudflare (Grátis + CDN + DDoS Protection)

**Vantagens:**
- ✅ SSL/TLS grátis
- ✅ CDN global (site mais rápido)
- ✅ Proteção contra DDoS
- ✅ Cache inteligente

**Configuração:**

1. **Criar conta:** https://cloudflare.com/
2. **Adicionar site:** Digite `salaoneilavargas.com.br`
3. **Copiar nameservers:**
   ```
   Exemplo:
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```
4. **Atualizar nameservers no Registro.br:**
   - Painel → Domínios → Alterar DNS
   - Cole os nameservers do Cloudflare
5. **Aguardar propagação:** ~24 horas (geralmente 15 min)
6. **Configurar SSL no Cloudflare:**
   - SSL/TLS → "Full" ou "Full (strict)"
   - Edge Certificates → "Always Use HTTPS" (ON)

---

## 6. Configurar Supabase

### 6.1. Atualizar URLs Permitidas

1. **Acessar:** https://supabase.com/dashboard
2. **Seu projeto** → Settings → Authentication
3. **Site URL:**
   ```
   https://salaoneilavargas.com.br
   ```
4. **Redirect URLs (adicionar):**
   ```
   https://salaoneilavargas.com.br/*
   https://www.salaoneilavargas.com.br/*
   https://seu-app.vercel.app/*
   ```

### 6.2. Configurar CORS

Em **Settings → API**:

**Allowed Origins:**
```
https://salaoneilavargas.com.br
https://www.salaoneilavargas.com.br
```

### 6.3. Atualizar Código (se necessário)

No arquivo `app/src/js/supabase-config.js`:

```javascript
// NÃO precisa mudar nada!
// As variáveis de ambiente já estão corretas
const SUPABASE_URL = 'https://xrpqqgtwomrmcdogyhrz.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-aqui';
```

---

## 7. Manutenção e Monitoramento

### Monitorar Uptime

**UptimeRobot (Grátis):**
- Site: https://uptimerobot.com/
- Monitora se o site está online
- Alerta por email/SMS se cair

### Analytics

**Google Analytics 4:**
1. Criar conta: https://analytics.google.com/
2. Adicionar no `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Backup Automático

**Supabase:**
- Backups automáticos diários (plano pago)
- Exportar manualmente: Dashboard → Database → Backup

**Código (GitHub):**
- Já está com backup automático!
- Push regularmente: `git push origin main`

---

## 📱 Deploy do APK (App Android)

### Após configurar domínio:

1. **Atualizar Capacitor Config:**

Editar `app/capacitor.config.json`:

```json
{
  "appId": "br.com.salaoneilavargas",
  "appName": "Salão Neila Vargas",
  "webDir": "src",
  "server": {
    "url": "https://salaoneilavargas.com.br",
    "cleartext": false,
    "androidScheme": "https"
  }
}
```

2. **Rebuild APK:**

```powershell
cd app
npx cap sync android
npx cap open android
```

3. **Publicar na Play Store (Opcional):**
   - Criar conta: https://play.google.com/console
   - Custo: $25 (uma vez)
   - Seguir wizard de publicação

---

## 🔥 Troubleshooting

### Erro: "DNS_PROBE_FINISHED_NXDOMAIN"
**Causa:** DNS não propagou ainda
**Solução:** Aguardar até 48h (geralmente 1-2 horas)

### Erro: "NET::ERR_CERT_AUTHORITY_INVALID"
**Causa:** SSL não configurado corretamente
**Solução:** Verificar Cloudflare SSL ou refazer Certbot

### Site carrega sem CSS/JS
**Causa:** Caminhos incorretos ou CORS
**Solução:** 
```javascript
// Usar caminhos absolutos
<link rel="stylesheet" href="/css/style.css">
<script src="/js/app.js"></script>
```

### Supabase retorna erro 401
**Causa:** URL não está nas Redirect URLs
**Solução:** Adicionar domínio no painel Supabase

---

## 📞 Suporte

**Vercel:** https://vercel.com/support
**Cloudflare:** https://community.cloudflare.com/
**Let's Encrypt:** https://community.letsencrypt.org/

---

## ✅ Checklist Final

Antes de ir ao ar:

- [ ] Domínio registrado
- [ ] DNS configurado
- [ ] Deploy funcionando (Vercel/VPS)
- [ ] HTTPS ativo (cadeado verde)
- [ ] Supabase URLs atualizadas
- [ ] Testar login/cadastro
- [ ] Testar agendamentos
- [ ] Testar em celulares diferentes
- [ ] Analytics configurado
- [ ] Backup configurado
- [ ] APK atualizado com novo domínio

---

**🎉 Pronto! Seu salão está online!**

**Recomendação Final:** Use **Vercel** para começar. É grátis, fácil e tem HTTPS automático. Quando o salão crescer, migre para VPS se necessário.
