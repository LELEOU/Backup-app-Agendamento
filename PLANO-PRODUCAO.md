# 🚀 PLANO DE PREPARAÇÃO PARA PRODUÇÃO

**Data:** 06/01/2025  
**Versão Alvo:** v1.0.0 Production Ready  
**Branch:** main

---

## 📋 CHECKLIST DE PRODUÇÃO

### ✅ Fase 1: Controle de Versão (CONCLUÍDO)
- [x] Git inicializado
- [x] Commit inicial criado
- [x] .gitignore configurado

---

### 🔧 Fase 2: Otimização de Build (EM ANDAMENTO)

#### 2.1. Tailwind CSS - Migrar de CDN para NPM
**Status:** ⏳ Pendente  
**Prioridade:** 🔴 CRÍTICA

**Passos:**
1. [ ] Instalar Tailwind CSS via npm
2. [ ] Criar arquivo `tailwind.config.js`
3. [ ] Configurar PostCSS
4. [ ] Atualizar `vite.config.ts` para processar Tailwind
5. [ ] Remover CDN do `index.html`
6. [ ] Testar build local
7. [ ] Commit: `feat: migrar Tailwind CSS de CDN para npm`

**Arquivos afetados:**
- `app/package.json` - Adicionar dependências
- `app/tailwind.config.js` - NOVO arquivo
- `app/postcss.config.js` - NOVO arquivo
- `app/src/index.html` - Remover linha CDN
- `app/src/css/style.css` - Adicionar diretivas Tailwind
- `app/vite.config.ts` - Configurar processamento

---

#### 2.2. Otimização de Assets
**Status:** ⏳ Pendente  
**Prioridade:** 🟡 MÉDIA

**Passos:**
1. [ ] Minificar imagens (logo.png, icone-de-login.png)
2. [ ] Otimizar favicon
3. [ ] Configurar cache de assets
4. [ ] Commit: `perf: otimizar assets e imagens`

---

#### 2.3. Build de Produção
**Status:** ⏳ Pendente  
**Prioridade:** 🔴 CRÍTICA

**Passos:**
1. [ ] Adicionar script de build otimizado
2. [ ] Configurar tree-shaking
3. [ ] Configurar code splitting
4. [ ] Testar build: `npm run build`
5. [ ] Verificar tamanho do bundle
6. [ ] Commit: `build: configurar build otimizado para produção`

---

### 🔒 Fase 3: Segurança e Performance

#### 3.1. Variáveis de Ambiente
**Status:** ⏳ Pendente  
**Prioridade:** 🔴 CRÍTICA

**Passos:**
1. [ ] Criar `.env.example` com variáveis necessárias
2. [ ] Documentar todas as env vars necessárias
3. [ ] Validar que credenciais não estão no código
4. [ ] Commit: `security: adicionar exemplo de variáveis de ambiente`

**Variáveis necessárias:**
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_TITLE=
VITE_APP_VERSION=
```

---

#### 3.2. Service Worker (HTTPS)
**Status:** ⏳ Pendente  
**Prioridade:** 🟡 MÉDIA

**Passos:**
1. [ ] Verificar configuração do Service Worker
2. [ ] Testar em ambiente HTTPS local
3. [ ] Documentar requisitos de HTTPS
4. [ ] Commit: `docs: adicionar requisitos de HTTPS para Service Worker`

---

#### 3.3. Analytics RPC (Opcional)
**Status:** ⏳ Pendente  
**Prioridade:** 🟢 BAIXA (Fallback funciona)

**Passos:**
1. [ ] Criar função SQL `get_dashboard_analytics`
2. [ ] Testar performance com dados grandes
3. [ ] Commit: `feat: adicionar função RPC para analytics otimizados`

---

### 🌐 Fase 4: Deploy

#### 4.1. Preparação de Deploy
**Status:** ⏳ Pendente  
**Prioridade:** 🔴 CRÍTICA

**Passos:**
1. [ ] Escolher plataforma (Vercel/Netlify recomendados)
2. [ ] Criar configuração de deploy
3. [ ] Configurar variáveis de ambiente no host
4. [ ] Testar build de produção localmente
5. [ ] Commit: `ci: adicionar configuração de deploy`

---

#### 4.2. Deploy Inicial
**Status:** ⏳ Pendente  
**Prioridade:** 🔴 CRÍTICA

**Passos:**
1. [ ] Fazer deploy de teste
2. [ ] Verificar HTTPS ativo
3. [ ] Testar Service Worker em produção
4. [ ] Testar notificações em produção
5. [ ] Validar conexão com Supabase
6. [ ] Commit: `deploy: primeira versão em produção`

---

### 📱 Fase 5: PWA (Progressive Web App)

#### 5.1. Validação PWA
**Status:** ⏳ Pendente  
**Prioridade:** 🟡 MÉDIA

**Passos:**
1. [ ] Validar manifest.json
2. [ ] Testar instalação no celular
3. [ ] Verificar ícones de todos os tamanhos
4. [ ] Testar funcionamento offline
5. [ ] Commit: `pwa: validar e otimizar configuração`

---

### 🧪 Fase 6: Testes em Produção

#### 6.1. Smoke Tests
**Status:** ⏳ Pendente  
**Prioridade:** 🔴 CRÍTICA

**Checklist de testes:**
- [ ] Login funciona
- [ ] Criar agendamento funciona
- [ ] Slots múltiplos funcionam
- [ ] Sistema de pausas funciona
- [ ] Comissões calculam corretamente
- [ ] Notificações aparecem
- [ ] Relatórios carregam
- [ ] Tema escuro/claro funciona
- [ ] Idiomas funcionam
- [ ] Funciona offline

---

### 📚 Fase 7: Documentação

#### 7.1. Atualizar Documentação
**Status:** ⏳ Pendente  
**Prioridade:** 🟡 MÉDIA

**Passos:**
1. [ ] Atualizar README.md com instruções de deploy
2. [ ] Criar guia de configuração de produção
3. [ ] Documentar variáveis de ambiente
4. [ ] Criar troubleshooting guide
5. [ ] Commit: `docs: atualizar para versão de produção`

---

## 🎯 ORDEM DE EXECUÇÃO RECOMENDADA

### Sprint 1 (Hoje - Crítico)
1. ✅ Git inicializado
2. ⏳ **Migrar Tailwind CSS** (2.1)
3. ⏳ **Configurar variáveis de ambiente** (3.1)
4. ⏳ **Build de produção** (2.3)

### Sprint 2 (Amanhã - Deploy)
5. ⏳ **Preparar deploy** (4.1)
6. ⏳ **Deploy inicial** (4.2)
7. ⏳ **Smoke tests** (6.1)

### Sprint 3 (Depois - Otimizações)
8. ⏳ Otimizar assets (2.2)
9. ⏳ Validar PWA (5.1)
10. ⏳ Analytics RPC (3.3) - Opcional
11. ⏳ Documentação final (7.1)

---

## 📊 PROGRESSO GERAL

```
Progresso: ████░░░░░░░░░░░░░░░░ 20%

Concluído: 3/15 tarefas críticas
```

---

## 🚨 BLOQUEADORES CONHECIDOS

Nenhum bloqueador identificado até o momento.

---

## 📝 NOTAS IMPORTANTES

1. **Não fazer deploy sem HTTPS** - Service Worker não funciona
2. **Testar em celular real** antes de liberar para o salão
3. **Backup do banco Supabase** antes de mudanças em produção
4. **Manter .env fora do Git** (já está no .gitignore)

---

## 🔗 REFERÊNCIAS

- [Tailwind Installation](https://tailwindcss.com/docs/installation)
- [Vite Build Optimization](https://vitejs.dev/guide/build.html)
- [Supabase Deploy Guide](https://supabase.com/docs/guides/platform/going-into-prod)
- [Vercel Deploy](https://vercel.com/docs)

---

**Próximo passo:** Começar Sprint 1 - Migrar Tailwind CSS

