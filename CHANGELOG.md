# 📝 CHANGELOG - Histórico de Versões# 📝 Changelog



Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.



O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),

e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).



------



## [2.0.0] - 2025-10-06## [1.0.0] - 2025-01-06



### 🎉 Grandes Mudanças### ✨ Adicionado



#### ✨ Adicionado#### ⏱️ Sistema de Slots Múltiplos

- **Sistema de Duração Inteligente por Cargo**- **Duração Variável**: Agendamentos de 30 a 180 minutos (1 a 6 slots)

  - Manicures: opções de 45, 90, 135, 180 minutos- **Seletor de Duração**: Campo no formulário com 6 opções predefinidas

  - Cabeleireiras: opções de 30, 60, 90, 120 minutos- **Blocos Visuais Unificados**: Renderização de um único bloco grande em vez de múltiplos pequenos

  - Duração atualiza automaticamente ao selecionar funcionário- **Detecção Inteligente de Conflitos**: Validação de todos os slots ocupados

  - Remove confusão de "1,5 slots"- **Coluna no Banco**: `duration INTEGER DEFAULT 30` na tabela `appointments`

- **Cálculo Automático**: Slots ocupados baseados na duração do agendamento

- **Pull-to-Refresh Nativo**

  - Puxe a tela para baixo para recarregar dados#### ⏸️ Sistema de Pausas/Handoffs

  - Indicador visual animado- **Tabela `appointment_handoffs`**: Armazena períodos de pausa

  - Feedback háptico (vibração)- **Integração com Conflitos**: Staff livre durante pausas pode aceitar novos agendamentos

  - Funciona em todas as visualizações- **Interface de Gerenciamento**: Adicionar/remover pausas em agendamentos existentes

- **Validação Inteligente**: Considera pausas ao verificar disponibilidade

- **Notificações do Sistema Android/iOS**

  - Integração com `@capacitor/local-notifications`#### 💰 Sistema de Comissões

  - Solicita permissão real do sistema operacional- **Cálculo Automático**: Comissões baseadas em percentuais por serviço

  - Funciona com app fechado- **Relatórios Detalhados**: Ganhos por profissional com filtros de período

  - Notificação de teste ao ativar- **Configuração Flexível**: Percentuais personalizáveis por tipo de serviço

- **Histórico Completo**: Tracking de todas as comissões pagas

- **Galeria e Câmera Nativa**

  - Acesso à galeria de fotos do dispositivo#### 🎨 Melhorias de UI/UX

  - Tirar fotos com câmera nativa- **Blocos Proporcionais**: Altura visual baseada na duração (60px por slot)

  - Edição de foto antes de enviar- **Informações Detalhadas**: Exibição de horário início-fim e duração

  - Upload para Supabase Storage- **Tooltips Informativos**: Explicações sobre slots múltiplos

- **Feedback Visual**: Indicadores claros de conflitos e disponibilidade

- **Logo e Ícones Personalizados**

  - Logo do Estúdio Neila Vargas implementada#### 📋 Matriz de Permissões

  - 87 ícones gerados automaticamente (todos os tamanhos)- **Controle Granular**: Permissões detalhadas por função e seção

  - Splash screens para Android (claro e escuro)- **Documentação Completa**: Tabela com todas as permissões do sistema

  - Favicon arredondado e responsivo- **RLS Policies**: Segurança em nível de banco de dados



#### 🎨 Melhorado### 🔧 Modificado

- **Interface Responsiva Completa**

  - Otimizada para tablets (≤768px)#### 🔄 Detecção de Conflitos (Reescrita Completa)

  - Otimizada para smartphones (≤480px)**Antes:**

  - Touch targets de 44x44px (padrão iOS/Android)```javascript

  - Botões em coluna no mobile// Verificava apenas horário único

  - Fontes ajustadas para telas pequenasif (existingAppt.time === requestedTime) return true;

```

- **Caminhos de Imagens**

  - Todos os ícones com caminho relativo (`./assets/`)**Depois:**

  - Compatível com APK nativo```javascript

  - Logo da sidebar usando imagem real// Verifica todos os slots + pausas

const requestedSlots = generateSlots(startTime, duration);

#### 🔧 Corrigidoconst existingSlots = generateSlots(appt.time, appt.duration);

- Ícones não carregavam no APK (caminhos absolutos)const handoffs = await getHandoffs(appt.id);

- Splash screen travava em "launchAutoHide: false"

- CDN do Supabase bloqueada no APKfor (const slot of requestedSlots) {

- Erro de build com top-level await    if (isInHandoff(slot, handoffs)) continue; // Staff livre

- Gradle cache causando APK desatualizado    if (existingSlots.includes(slot)) return true; // Conflito

}

#### 📦 Dependências```

- Adicionado `@capacitor/app@7.0.1`

- Adicionado `@capacitor/haptics@7.0.1`#### 📊 Renderização da Agenda

- Adicionado `@capacitor/local-notifications@7.0.1`**Antes:**

- Adicionado `@capacitor/camera@7.0.1`- Renderizava todos os slots individualmente

- Adicionado `@capacitor/filesystem@7.0.1`- Agendamentos longos apareciam fragmentados

- Adicionado `@capacitor/assets` (dev)

- Atualizado `@supabase/supabase-js@2.x` (local, não CDN)**Depois:**

- Rastreia slots ocupados em `Set`

---- Renderiza apenas primeiro slot de cada agendamento

- Bloco visual unificado com altura proporcional

## [1.5.0] - 2025-10-05

### 🧪 Testes

### ✨ Adicionado

- Sistema de tradução (PT-BR, EN-US)#### ✅ Cobertura Completa (10 Cenários)

- Tema escuro/claro1. ✅ Agendamento simples (30 min)

- Horários customizados por funcionário2. ✅ Agendamento longo (90 min) 

- Sistema de comissões3. ✅ Conflito direto (bloqueio correto)

4. ✅ Conflito parcial (bloqueio correto)

### 🎨 Melhorado5. ✅ Sem conflito (permitir agendamento)

- Performance do calendário6. ✅ Agendamento com pausa (sem conflito)

- Validação de conflitos de horário7. ✅ Edição de duração

- Interface de login8. ✅ Renderização visual correta

9. ✅ Múltiplos agendamentos complexos

### 🔧 Corrigido10. ✅ Validação de formulário

- Bug no cálculo de duração de agendamentos

- Erro ao deletar cliente com agendamentos**Taxa de Sucesso: 100%**



---### 📚 Documentação



## [1.0.0] - 2025-09-15#### Criada

- `.github/TESTES.md` - Relatório completo de testes

### 🎉 Lançamento Inicial- `docs/SISTEMA-SLOTS-MULTIPLOS.md` - Documentação técnica completa

- `docs/INDEX.md` - Índice central de documentação

#### ✨ Funcionalidades Core- `RESUMO-FINAL.md` - Resumo executivo do sistema

- **Gestão de Agendamentos**- `CONTRIBUTING.md` - Guia de contribuição

  - Criar, editar, deletar agendamentos- `CHANGELOG.md` - Este arquivo

  - Visualização mensal, semanal, diária

  - Status: pending, confirmed, in progress, completed, cancelled, no show#### Organizada

  - Validação de conflitos de horário- Movidos 10+ arquivos MD para `docs/`

- Removidos arquivos duplicados/obsoletos

- **Gestão de Clientes**- Estrutura limpa: essenciais na raiz, técnicos em `docs/`

  - Cadastro completo de clientes

  - Histórico de atendimentos### 🐛 Corrigido

  - Busca rápida- Conflitos de agendamento não detectados corretamente

- Blocos visuais fragmentados em agendamentos longos

- **Gestão de Serviços**- Permissões inconsistentes entre usuários

  - Cadastro de serviços

  - Preços e durações---

  - Comissões configuráveis

## [0.9.0] - 2024-08-06 (Release Inicial)

- **Gestão de Funcionários**

  - Cadastro de staff### ✨ Adicionado

  - Diferentes níveis de permissão- Sistema básico de agendamento

  - Foto de perfil- Autenticação com Supabase

- Dashboard por função (Admin/Manicure/Recepcionista)

- **Sistema de Permissões**- Relatórios individuais

  - Admin: acesso total- PWA com service worker

  - Receptionist: criar agendamentos- Tema claro/escuro

  - Manicurist/Hairdresser: ver apenas seus agendamentos- Internacionalização (PT-BR, EN-US)

- Notificações push

#### 🛠️ Tecnologias- Sistema de permissões RLS

- Vite 6.3.6

- Tailwind CSS 3.4.17---

- Supabase (PostgreSQL + Auth + Storage)

- Capacitor 7.0.1## Tipos de Mudanças

- Java 21- `✨ Adicionado` - Para novas funcionalidades

- `🔧 Modificado` - Para mudanças em funcionalidades existentes

---- `🗑️ Removido` - Para funcionalidades removidas

- `🐛 Corrigido` - Para correções de bugs

## 📅 Próximas Versões (Planejado)- `🔒 Segurança` - Para correções de vulnerabilidades

- `📚 Documentação` - Para mudanças na documentação

### [2.1.0] - Previsto para Nov/2025- `🧪 Testes` - Para adição/modificação de testes

- [ ] App do cliente (agendamento online)

- [ ] Sistema de cashback/pontos---

- [ ] Integração WhatsApp

- [ ] Exportar relatórios (PDF)<div align="center">



### [2.2.0] - Previsto para Dez/2025**[⬆️ Voltar ao README](README.md)**

- [ ] Controle de estoque

- [ ] Dashboard analyticsMantido por [@LELEOU](https://github.com/LELEOU) com ❤️

- [ ] Sistema de avaliações

- [ ] Multi-salão (franquias)</div>


### [3.0.0] - Previsto para 2026
- [ ] Build para iOS (App Store)
- [ ] Modo offline completo
- [ ] Sincronização em tempo real
- [ ] API pública para integrações

---

## 🔖 Tipos de Mudanças

- **Adicionado** - Novas funcionalidades
- **Alterado** - Mudanças em funcionalidades existentes
- **Descontinuado** - Funcionalidades que serão removidas
- **Removido** - Funcionalidades removidas
- **Corrigido** - Correções de bugs
- **Segurança** - Vulnerabilidades corrigidas

---

## 📊 Estatísticas do Projeto

### Versão 2.0.0
- **Linhas de Código:** ~12.000
- **Arquivos:** 85+
- **Funcionalidades:** 25+
- **Plugins Capacitor:** 7
- **Tamanho APK:** 6.47 MB
- **Tamanho JS Bundle:** 807 KB

### Crescimento
- v1.0.0 → v1.5.0: +30% funcionalidades
- v1.5.0 → v2.0.0: +50% recursos nativos
- Total de commits: 50+

---

## 🙏 Contribuidores

- **LELEOU** - Desenvolvimento principal
- **Estúdio Neila Vargas** - Requisitos e testes

---

## 📞 Reportar Problemas

Encontrou um bug em alguma versão específica? [Abra uma issue](https://github.com/LELEOU/Backup-app-Agendamento/issues) informando:
- Versão afetada
- Descrição do problema
- Passos para reproduzir

---

**Última atualização:** 06/10/2025
