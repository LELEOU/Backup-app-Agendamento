# 📋 Novo Fluxo de Agendamento - Sistema de Salão

## 🔄 **Mudança no Processo**

### **ANTES (Antigo):**
1. Recepcionista marcava agendamento **COM** serviço específico
2. Cliente já sabia o preço final antecipadamente
3. Sistema menos flexível

### **AGORA (Novo):**
1. **Recepcionista** marca agendamento **SEM** serviço específico (apenas cliente + profissional + horário)
2. **Manicure/Profissional** adiciona os serviços durante/após o atendimento
3. **Cliente** paga na recepção com base nos serviços realmente realizados

---

## 👥 **Responsabilidades por Usuário**

### 🏢 **Recepcionista/Admin:**
- ✅ Marca agendamentos (cliente + profissional + horário)
- ✅ Recebe pagamento final do cliente
- ✅ Visualiza todos os serviços realizados
- ✅ Gerencia relatórios e comissões

### 💅 **Manicure/Profissional:**
- ✅ Vê seus agendamentos do dia
- ✅ Adiciona serviços realizados durante o atendimento
- ✅ Define preços específicos (pode ser promocional)
- ✅ Marca agendamento como "Concluído"
- ✅ Visualiza sua comissão por serviço

---

## 🎯 **Como Usar o Novo Sistema**

### **1. Marcando um Agendamento (Recepcionista):**
1. Clique em "➕ Novo Agendamento"
2. Selecione apenas:
   - **Cliente**
   - **Profissional**
   - **Data e Horário**
3. Salve o agendamento
4. O sistema mostrará "⏳ Aguardando serviços"

### **2. Adicionando Serviços (Manicure):**
1. Encontre o agendamento no calendário
2. Clique no botão "➕ Add Serviços"
3. Adicione cada serviço realizado:
   - Selecione o serviço
   - Defina quantidade (se fez 2x)
   - Ajuste o preço se necessário
4. Clique "Marcar como Concluído" quando terminar

### **3. Finalizando Pagamento (Recepcionista):**
1. Clique em "💰 Ver Serviços" no agendamento
2. Confira o valor total
3. Receba o pagamento do cliente

---

## 💡 **Vantagens do Novo Fluxo**

### ✅ **Flexibilidade:**
- Manicure pode adicionar serviços extras durante o atendimento
- Preços podem ser ajustados (promoções, descontos)
- Não precisa refazer agendamento se mudar o serviço

### ✅ **Precisão:**
- Cobrança baseada no que foi realmente feito
- Comissões calculadas sobre serviços efetivos
- Relatórios mais precisos

### ✅ **Experiência do Cliente:**
- Pode decidir serviços adicionais na hora
- Transparência total no que está pagando
- Flexibilidade para mudanças de última hora

---

## 🗂️ **Estrutura do Banco de Dados**

### **Tabela: `appointments`**
```sql
- client_id (obrigatório)
- staff_id (obrigatório) 
- service_id (OPCIONAL - removido da obrigatoriedade)
- date, time, notes, status
```

### **Nova Tabela: `appointment_services`**
```sql
- appointment_id (referência ao agendamento)
- service_id (serviço realizado)
- quantity (quantidade de vezes)
- price_charged (preço cobrado na hora)
- notes (observações do serviço)
```

---

## 🚀 **Migração**

Para implementar as mudanças no banco de dados:

1. Execute o arquivo `migration-appointment-flow.sql` no Supabase
2. Isso criará a nova tabela e ajustará as constraints
3. Agendamentos existentes continuarão funcionando normalmente

---

## 📊 **Relatórios e Comissões**

- **Comissões** agora são calculadas por serviço individual
- **Relatórios** mostram serviços realmente realizados
- **Receita** baseada em valores efetivamente cobrados
- **Histórico** completo de todos os serviços por agendamento

---

## 🎨 **Interface**

### **Indicadores Visuais:**
- 🔄 **"⏳ Aguardando serviços"** - Agendamento sem serviços
- 💰 **"Ver Serviços"** - Agendamento com serviços adicionados
- ➕ **"Add Serviços"** - Botão para manicures adicionarem serviços

### **Cores por Status:**
- **Azul** - Agendado (aguardando)
- **Verde** - Concluído (com serviços)
- **Vermelho** - Cancelado
- **Cinza** - Não compareceu

Este novo fluxo oferece muito mais flexibilidade e precisão para o dia a dia do salão! 🎉
