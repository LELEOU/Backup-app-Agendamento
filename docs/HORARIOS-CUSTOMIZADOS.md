# 📅 Horários Customizados - Guia de Uso

## 🎯 Visão Geral

O sistema de **Horários Customizados** permite que cada funcionário personalize seus horários de trabalho para dias específicos, além de configurar um horário padrão semanal.

---

## ✨ Funcionalidades Implementadas

### 1. **Horário Padrão Semanal** (Tela "Meus Horários")
- ⏱️ Definir horário de início e fim do expediente
- 🍽️ Configurar horário de almoço (início e fim)
- 📅 Selecionar dias de trabalho da semana
- 💾 Salvar configuração padrão

### 2. **Customização de Dias Específicos** (Calendário)
- ⏰ Alterar horários para um dia específico
- 🌴 Marcar dia como folga
- 📝 Adicionar observações (ex: "Reunião às 14h")
- 🗑️ Remover customização (volta ao padrão)

### 3. **Indicadores Visuais**
- 🔵 Badge azul no calendário mensal: dia com horário customizado
- 🟡 Badge amarelo no calendário mensal: dia de folga
- 📊 Banner informativo na visualização diária mostrando customizações

---

## 📖 Como Usar

### Configurar Horário Padrão

1. Clique no menu lateral em **"Meus Horários"**
2. Preencha os campos:
   - Início do Expediente (ex: 08:00)
   - Fim do Expediente (ex: 18:00)
   - Início do Almoço (ex: 12:00)
   - Fim do Almoço (ex: 13:00)
3. Marque os dias de trabalho
4. Clique em **"Salvar Horário Padrão"**

### Customizar Dia Específico

#### Via Calendário (Visualização Diária)
1. Abra o **Calendário**
2. Navegue até o dia desejado (visualização diária)
3. Clique no botão **"Customizar Horário"** (canto superior direito)
4. Configure:
   - **Toggle Folga/Trabalho**: Ative para marcar como folga
   - **Horários**: Início, fim, almoço (se for dia de trabalho)
   - **Observações**: Notas opcionais
5. Clique em **"Salvar"**

#### Remover Customização
1. Abra a customização do dia
2. Clique em **"Remover Customização"**
3. Confirme a ação
4. O dia voltará a usar o horário padrão

---

## 🎨 Interface Visual

### Calendário Mensal
```
┌─────────────────────────────┐
│ Dom Seg Ter Qua Qui Sex Sáb │
├─────────────────────────────┤
│  1   2⏰  3   4   5🌴  6   7 │
│                             │
│  8   9   10  11  12  13  14 │
└─────────────────────────────┘

⏰ = Horário customizado
🌴 = Dia de folga
```

### Visualização Diária com Customização
```
┌──────────────────────────────────────────┐
│ ⏰ Horário Customizado                    │
│ 09:00 - 17:00 • Almoço: 12:30-13:30      │
│ Observação: Sair mais cedo               │
│                                 [Editar]  │
└──────────────────────────────────────────┘
```

---

## 🔧 Funcionalidades Técnicas

### Banco de Dados
Tabela: `staff_daily_schedule`
```sql
- id (UUID)
- staff_id (UUID) → Referência ao funcionário
- date (DATE) → Data específica
- start_time (TIME) → Início do expediente
- end_time (TIME) → Fim do expediente
- lunch_start (TIME) → Início do almoço
- lunch_end (TIME) → Fim do almoço
- is_day_off (BOOLEAN) → Se é folga
- notes (TEXT) → Observações
```

### Funções JavaScript
- `showDayScheduleModal(date)` - Abre modal de customização
- `deleteDaySchedule(staffId, date)` - Remove customização
- `db.getDailySchedule(staffId, date)` - Busca horário do dia
- `db.setDailySchedule(data)` - Salva horário customizado
- `db.deleteDailySchedule(staffId, date)` - Deleta customização
- `db.getStaffScheduleForMonth(staffId, year, month)` - Busca todos do mês

---

## 🎯 Casos de Uso

### Exemplo 1: Consulta Médica
```
Dia: 15/10/2025
Ação: Customizar horário
Configuração:
  - Início: 09:00 (ao invés de 08:00)
  - Fim: 18:00
  - Observação: "Consulta médica às 8h"
```

### Exemplo 2: Folga
```
Dia: 20/10/2025
Ação: Marcar como folga
Configuração:
  - Toggle: Ativado (Dia de Folga)
  - Observação: "Viagem"
Resultado: Dia fica bloqueado para agendamentos
```

### Exemplo 3: Horário Especial
```
Dia: 25/10/2025
Ação: Customizar horário
Configuração:
  - Início: 10:00
  - Fim: 20:00
  - Almoço: 14:00-15:00
  - Observação: "Horário estendido - evento"
```

---

## ⚡ Benefícios

✅ **Flexibilidade**: Cada funcionário controla sua agenda
✅ **Autonomia**: Não precisa pedir admin para ajustar horários
✅ **Visual**: Fácil ver dias customizados no calendário
✅ **Integração**: Agendamentos respeitam horários personalizados
✅ **Histórico**: Customizações ficam salvas no banco

---

## 🚀 Próximas Melhorias Possíveis

- [ ] Permitir customização de múltiplos dias de uma vez
- [ ] Templates de horários (ex: "Meio expediente")
- [ ] Aprovação de admin para folgas
- [ ] Relatório de horas trabalhadas baseado em customizações
- [ ] Sincronização com calendário externo (Google Calendar)

---

## 📝 Notas Importantes

1. **Horário Padrão vs Customizado**: 
   - O padrão se aplica a todos os dias de trabalho selecionados
   - A customização sobrescreve o padrão apenas para aquele dia

2. **Persistência**:
   - Customizações são salvas permanentemente no banco
   - Remover customização restaura o horário padrão

3. **Permissões**:
   - Funcionários podem customizar apenas seus próprios horários
   - Admin pode ver e editar horários de todos

4. **Validação**:
   - Horários são validados no frontend e backend
   - Não é possível criar agendamentos fora do horário de trabalho

---

**Desenvolvido para App de Agendamento de Salão**
📅 Versão com Horários Customizados - Outubro 2025
