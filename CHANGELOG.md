# 📝 Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.0.0] - 2025-01-06

### ✨ Adicionado

#### ⏱️ Sistema de Slots Múltiplos
- **Duração Variável**: Agendamentos de 30 a 180 minutos (1 a 6 slots)
- **Seletor de Duração**: Campo no formulário com 6 opções predefinidas
- **Blocos Visuais Unificados**: Renderização de um único bloco grande em vez de múltiplos pequenos
- **Detecção Inteligente de Conflitos**: Validação de todos os slots ocupados
- **Coluna no Banco**: `duration INTEGER DEFAULT 30` na tabela `appointments`
- **Cálculo Automático**: Slots ocupados baseados na duração do agendamento

#### ⏸️ Sistema de Pausas/Handoffs
- **Tabela `appointment_handoffs`**: Armazena períodos de pausa
- **Integração com Conflitos**: Staff livre durante pausas pode aceitar novos agendamentos
- **Interface de Gerenciamento**: Adicionar/remover pausas em agendamentos existentes
- **Validação Inteligente**: Considera pausas ao verificar disponibilidade

#### 💰 Sistema de Comissões
- **Cálculo Automático**: Comissões baseadas em percentuais por serviço
- **Relatórios Detalhados**: Ganhos por profissional com filtros de período
- **Configuração Flexível**: Percentuais personalizáveis por tipo de serviço
- **Histórico Completo**: Tracking de todas as comissões pagas

#### 🎨 Melhorias de UI/UX
- **Blocos Proporcionais**: Altura visual baseada na duração (60px por slot)
- **Informações Detalhadas**: Exibição de horário início-fim e duração
- **Tooltips Informativos**: Explicações sobre slots múltiplos
- **Feedback Visual**: Indicadores claros de conflitos e disponibilidade

#### 📋 Matriz de Permissões
- **Controle Granular**: Permissões detalhadas por função e seção
- **Documentação Completa**: Tabela com todas as permissões do sistema
- **RLS Policies**: Segurança em nível de banco de dados

### 🔧 Modificado

#### 🔄 Detecção de Conflitos (Reescrita Completa)
**Antes:**
```javascript
// Verificava apenas horário único
if (existingAppt.time === requestedTime) return true;
```

**Depois:**
```javascript
// Verifica todos os slots + pausas
const requestedSlots = generateSlots(startTime, duration);
const existingSlots = generateSlots(appt.time, appt.duration);
const handoffs = await getHandoffs(appt.id);

for (const slot of requestedSlots) {
    if (isInHandoff(slot, handoffs)) continue; // Staff livre
    if (existingSlots.includes(slot)) return true; // Conflito
}
```

#### 📊 Renderização da Agenda
**Antes:**
- Renderizava todos os slots individualmente
- Agendamentos longos apareciam fragmentados

**Depois:**
- Rastreia slots ocupados em `Set`
- Renderiza apenas primeiro slot de cada agendamento
- Bloco visual unificado com altura proporcional

### 🧪 Testes

#### ✅ Cobertura Completa (10 Cenários)
1. ✅ Agendamento simples (30 min)
2. ✅ Agendamento longo (90 min) 
3. ✅ Conflito direto (bloqueio correto)
4. ✅ Conflito parcial (bloqueio correto)
5. ✅ Sem conflito (permitir agendamento)
6. ✅ Agendamento com pausa (sem conflito)
7. ✅ Edição de duração
8. ✅ Renderização visual correta
9. ✅ Múltiplos agendamentos complexos
10. ✅ Validação de formulário

**Taxa de Sucesso: 100%**

### 📚 Documentação

#### Criada
- `.github/TESTES.md` - Relatório completo de testes
- `docs/SISTEMA-SLOTS-MULTIPLOS.md` - Documentação técnica completa
- `docs/INDEX.md` - Índice central de documentação
- `RESUMO-FINAL.md` - Resumo executivo do sistema
- `CONTRIBUTING.md` - Guia de contribuição
- `CHANGELOG.md` - Este arquivo

#### Organizada
- Movidos 10+ arquivos MD para `docs/`
- Removidos arquivos duplicados/obsoletos
- Estrutura limpa: essenciais na raiz, técnicos em `docs/`

### 🐛 Corrigido
- Conflitos de agendamento não detectados corretamente
- Blocos visuais fragmentados em agendamentos longos
- Permissões inconsistentes entre usuários

---

## [0.9.0] - 2024-08-06 (Release Inicial)

### ✨ Adicionado
- Sistema básico de agendamento
- Autenticação com Supabase
- Dashboard por função (Admin/Manicure/Recepcionista)
- Relatórios individuais
- PWA com service worker
- Tema claro/escuro
- Internacionalização (PT-BR, EN-US)
- Notificações push
- Sistema de permissões RLS

---

## Tipos de Mudanças
- `✨ Adicionado` - Para novas funcionalidades
- `🔧 Modificado` - Para mudanças em funcionalidades existentes
- `🗑️ Removido` - Para funcionalidades removidas
- `🐛 Corrigido` - Para correções de bugs
- `🔒 Segurança` - Para correções de vulnerabilidades
- `📚 Documentação` - Para mudanças na documentação
- `🧪 Testes` - Para adição/modificação de testes

---

<div align="center">

**[⬆️ Voltar ao README](README.md)**

Mantido por [@LELEOU](https://github.com/LELEOU) com ❤️

</div>
