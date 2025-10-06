# 🚀 Guia Completo de Funcionalidades

**Sistema de Agendamento para Salões de Beleza v1.0.0**

Este documento detalha todas as funcionalidades implementadas no sistema.

---

## 📋 Índice

- [⏱️ Sistema de Slots Múltiplos](#️-sistema-de-slots-múltiplos)
- [⏸️ Sistema de Pausas/Handoffs](#️-sistema-de-pausashandoffs)
- [💰 Sistema de Comissões](#-sistema-de-comissões)
- [📅 Agendamento Básico](#-agendamento-básico)
- [👥 Gestão de Usuários](#-gestão-de-usuários)
- [📊 Relatórios e Analytics](#-relatórios-e-analytics)
- [🔔 Notificações](#-notificações)
- [🎨 Temas e Personalização](#-temas-e-personalização)
- [🌐 Internacionalização](#-internacionalização)
- [📱 Progressive Web App](#-progressive-web-app)

---

## ⏱️ Sistema de Slots Múltiplos

### 📖 Descrição
Permite criar agendamentos com duração variável, ocupando múltiplos slots de 30 minutos.

### ✨ Funcionalidades

#### 1. Seleção de Duração
```html
<select name="duration" required>
    <option value="30">30 minutos (1 slot)</option>
    <option value="60">60 minutos (2 slots)</option>
    <option value="90">90 minutos (3 slots)</option>
    <option value="120">120 minutos (4 slots)</option>
    <option value="150">150 minutos (5 slots)</option>
    <option value="180">180 minutos (6 slots)</option>
</select>
```

#### 2. Detecção Inteligente de Conflitos
- Gera todos os slots ocupados baseado na duração
- Verifica slot por slot para evitar sobreposições
- Considera períodos de pausa (handoffs)

**Exemplo:**
```javascript
// Agendamento de 90 minutos às 08:00
// Ocupa: 08:00, 08:30, 09:00 (3 slots)

// Tentativa de agendar às 08:30
// ❌ BLOQUEADO - conflito com slot do meio

// Tentativa de agendar às 09:30
// ✅ PERMITIDO - sem conflito
```

#### 3. Blocos Visuais Unificados
- Renderiza um único bloco grande
- Altura proporcional à duração
- Exibe horário início-fim

**Cálculo:**
```javascript
const slotsCount = Math.ceil(duration / 30);
const blockHeight = (slotsCount * 60) - 12; // px
```

### 🎯 Casos de Uso

#### Exemplo 1: Manicure Simples
- **Duração:** 30 minutos
- **Slots ocupados:** 1 (ex: 09:00)
- **Visual:** Bloco pequeno de 48px

#### Exemplo 2: Manicure + Pedicure
- **Duração:** 90 minutos
- **Slots ocupados:** 3 (ex: 10:00, 10:30, 11:00)
- **Visual:** Bloco grande de 168px

#### Exemplo 3: Tratamento Completo
- **Duração:** 150 minutos
- **Slots ocupados:** 5 (ex: 14:00, 14:30, 15:00, 15:30, 16:00)
- **Visual:** Bloco muito grande de 288px

### 🔧 Implementação Técnica

**Banco de Dados:**
```sql
ALTER TABLE appointments ADD COLUMN duration INTEGER DEFAULT 30;
```

**Frontend (Formulário):**
```javascript
const duration = parseInt(formData.get('duration')) || 30;
```

**Validação de Conflitos:**
```javascript
async function checkTimeConflict(staffId, date, startTime, duration, excludeId) {
    // 1. Gerar slots solicitados
    const requestedSlots = [];
    const slotsCount = Math.ceil(duration / 30);
    for (let i = 0; i < slotsCount; i++) {
        requestedSlots.push(addMinutesToTime(startTime, i * 30));
    }
    
    // 2. Verificar contra agendamentos existentes
    const staffAppointments = await getStaffAppointments(staffId, date);
    
    for (const existingAppt of staffAppointments) {
        if (existingAppt.id === excludeId) continue;
        
        // Obter pausas deste agendamento
        const handoffs = await db.getAppointmentHandoffs(existingAppt.id);
        
        // Gerar slots do agendamento existente
        const existingSlotsCount = Math.ceil(existingAppt.duration / 30);
        const existingSlots = [];
        for (let i = 0; i < existingSlotsCount; i++) {
            existingSlots.push(addMinutesToTime(existingAppt.time, i * 30));
        }
        
        // 3. Verificar cada slot solicitado
        for (const requestedSlot of requestedSlots) {
            // Se está em pausa, staff está livre
            const isInHandoff = handoffs.some(h => 
                requestedSlot >= h.start_time && requestedSlot < h.end_time
            );
            if (isInHandoff) continue;
            
            // Verificar conflito real
            if (existingSlots.includes(requestedSlot)) {
                return true; // CONFLITO!
            }
        }
    }
    
    return false; // SEM CONFLITO
}
```

---

## ⏸️ Sistema de Pausas/Handoffs

### 📖 Descrição
Permite pausar um atendimento em andamento para que o profissional possa atender outro cliente (ex: durante secagem de esmalte).

### ✨ Funcionalidades

#### 1. Criação de Pausas
```javascript
// Exemplo: Agendamento das 08:00 às 09:30 (90 min)
// Pausa das 08:45 às 09:15 (30 min)

const handoff = {
    appointment_id: appointmentId,
    start_time: '08:45',
    end_time: '09:15',
    reason: 'Secagem de esmalte'
};
```

#### 2. Integração com Conflitos
```javascript
// Durante pausa, staff está LIVRE
// Pode aceitar outro agendamento no mesmo horário

// Agendamento A: 08:00-09:30 com pausa 08:45-09:15
// Agendamento B: 09:00-09:30 (30 min)
// ✅ PERMITIDO - B está dentro da pausa de A
```

#### 3. Visualização
- Indicador visual de pausas no calendário
- Lista de pausas por agendamento
- Edição/remoção de pausas

### 🎯 Casos de Uso

#### Exemplo 1: Secagem de Esmalte
1. Cliente A: Manicure 08:00-08:30
2. Aplicação de esmalte termina às 08:30
3. **Pausa criada: 08:30-08:45** (secagem)
4. Durante pausa, manicure pode atender Cliente B

#### Exemplo 2: Máscara Capilar
1. Cliente C: Tratamento 14:00-15:30
2. Máscara aplicada às 14:30
3. **Pausa criada: 14:30-15:00** (ação da máscara)
4. Profissional livre para outros atendimentos

### 🔧 Implementação Técnica

**Banco de Dados:**
```sql
CREATE TABLE appointment_handoffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES users(id),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Frontend (Criar Pausa):**
```javascript
async function createHandoff(appointmentId, startTime, endTime, reason) {
    const { data, error } = await supabase
        .from('appointment_handoffs')
        .insert({
            appointment_id: appointmentId,
            start_time: startTime,
            end_time: endTime,
            reason: reason
        });
    
    return { data, error };
}
```

---

## 💰 Sistema de Comissões

### 📖 Descrição
Calcula automaticamente comissões de profissionais baseadas em serviços realizados.

### ✨ Funcionalidades

#### 1. Percentuais Configuráveis
```javascript
const commissionRates = {
    'manicure': 40,        // 40% do valor
    'pedicure': 40,
    'design': 50,          // 50% do valor
    'alongamento': 45,
    'hidratacao': 35
};
```

#### 2. Cálculo Automático
```javascript
// Serviço: Manicure - R$ 50,00
// Comissão: 40%
// Valor profissional: R$ 20,00

const commission = servicePrice * (commissionRate / 100);
```

#### 3. Relatórios
- Comissões por período (dia/semana/mês)
- Comissões por profissional
- Exportação em CSV/PDF
- Gráficos de desempenho

### 🎯 Casos de Uso

#### Exemplo: Relatório Mensal
```
Profissional: Maria Silva
Período: Janeiro 2025

Serviço          | Qtd | Valor Total | Comissão (40%)
-----------------|-----|-------------|---------------
Manicure         | 45  | R$ 2.250,00 | R$ 900,00
Pedicure         | 30  | R$ 1.800,00 | R$ 720,00
Design de Unhas  | 20  | R$ 1.200,00 | R$ 600,00
-----------------|-----|-------------|---------------
TOTAL            | 95  | R$ 5.250,00 | R$ 2.220,00
```

### 🔧 Implementação Técnica

**Banco de Dados:**
```sql
CREATE TABLE commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES users(id),
    appointment_id UUID REFERENCES appointments(id),
    service_type TEXT,
    service_price DECIMAL(10,2),
    commission_rate INTEGER,
    commission_amount DECIMAL(10,2),
    date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📅 Agendamento Básico

### ✨ Funcionalidades
- Criação de agendamentos
- Edição de agendamentos
- Cancelamento
- Status (Agendado/Confirmado/Concluído/Cancelado)
- Notas e observações
- Seleção de cliente e profissional
- Seleção de serviço

### 🎯 Fluxo
1. Selecionar cliente (ou criar novo)
2. Selecionar profissional
3. Selecionar data e horário
4. Selecionar duração
5. Adicionar serviço(s)
6. Adicionar observações (opcional)
7. Confirmar agendamento

---

## 👥 Gestão de Usuários

### 🔐 Funções (Roles)

#### 1. Administrador
**Permissões:**
- ✅ Acesso total ao sistema
- ✅ Criar/editar/excluir usuários
- ✅ Configurações globais
- ✅ Todos os relatórios
- ✅ Gerenciar permissões

#### 2. Manicure
**Permissões:**
- ✅ Ver próprios agendamentos
- ✅ Atualizar status de serviços
- ✅ Ver relatórios pessoais
- ✅ Gerenciar pausas
- ❌ Ver agendamentos de outros
- ❌ Configurações

#### 3. Recepcionista
**Permissões:**
- ✅ Criar/editar agendamentos
- ✅ Gerenciar clientes
- ✅ Ver agenda geral
- ✅ Enviar notificações
- ❌ Ver relatórios financeiros
- ❌ Configurações

### 🔒 Row Level Security (RLS)
```sql
-- Exemplo: Manicures só veem próprios agendamentos
CREATE POLICY "manicures_own_appointments" ON appointments
    FOR SELECT USING (
        auth.uid() = staff_id OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

---

## 📊 Relatórios e Analytics

### 📈 Tipos de Relatórios

#### 1. Dashboard Geral
- Total de agendamentos (dia/semana/mês)
- Taxa de ocupação
- Serviços mais populares
- Receita total
- Comissões totais

#### 2. Relatório por Profissional
- Agendamentos realizados
- Serviços prestados
- Receita gerada
- Comissões ganhas
- Avaliação média

#### 3. Relatório Financeiro
- Receita por período
- Receita por serviço
- Comissões pagas
- Gráficos de tendência

#### 4. Relatório de Clientes
- Clientes ativos
- Frequência de visitas
- Serviços preferidos
- Ticket médio

### 📊 Visualizações
- Gráficos de linha (tendências)
- Gráficos de barra (comparações)
- Gráficos de pizza (distribuição)
- Tabelas detalhadas

---

## 🔔 Notificações

### 📱 Tipos

#### 1. Push Notifications
- Novos agendamentos
- Lembretes (1h antes)
- Cancelamentos
- Atualizações de status

#### 2. Notificações Nativas
- Fallback quando push não disponível
- Mesmas informações

#### 3. Configurações
- Ativar/desativar por tipo
- Escolher antecedência de lembretes
- Som/vibração

---

## 🎨 Temas e Personalização

### 🌓 Temas Disponíveis
- ☀️ **Claro** - Design limpo e profissional
- 🌙 **Escuro** - Reduz cansaço visual
- 🎨 **Customizado** - Cores personalizáveis

### ⚙️ Personalização
```javascript
// Variáveis CSS customizáveis
:root {
    --accent-primary: #ec4899;
    --accent-secondary: #8b5cf6;
    --background-light: #ffffff;
    --background-dark: #1a1a1a;
}
```

---

## 🌐 Internacionalização

### 🗣️ Idiomas Suportados
- 🇧🇷 Português (PT-BR) - Padrão
- 🇺🇸 Inglês (EN-US)

### 📝 Adicionando Novos Idiomas
```javascript
// app/src/js/translations/es-ES.js
export default {
    common: {
        save: 'Guardar',
        cancel: 'Cancelar',
        // ...
    },
    appointments: {
        title: 'Citas',
        // ...
    }
};
```

---

## 📱 Progressive Web App

### ✨ Recursos PWA

#### 1. Instalável
- Adicionar à tela inicial
- Funciona como app nativo
- Ícone personalizado

#### 2. Offline
- Cache de assets estáticos
- Sincronização ao reconectar
- Service Worker

#### 3. Performance
- Carregamento rápido
- Lazy loading de imagens
- Code splitting

---

## 🧪 Testado e Aprovado

### ✅ Cobertura de Testes
- **Slots Múltiplos:** 100%
- **Sistema de Pausas:** 100%
- **Conflitos:** 100%
- **Comissões:** 100%
- **Permissões:** 100%

**10 Cenários testados - 100% aprovados**

Veja o [Relatório de Testes Completo](../.github/TESTES.md)

---

<div align="center">

**[⬆️ Voltar ao README](../README.md)**

Desenvolvido com ❤️ por [@LELEOU](https://github.com/LELEOU)

</div>
