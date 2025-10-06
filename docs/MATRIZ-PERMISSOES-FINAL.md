# 📋 Matriz de Permissões CORRETA - Sistema de Agendamento

## 🎯 Permissões por Cargo (ATUALIZADO)

### 👑 ADMIN (Administrador)
**Acesso Total** - Pode fazer TUDO no sistema

| Funcionalidade | Permissão |
|---|:---:|
| Ver todos os agendamentos | ✅ |
| Criar agendamentos | ✅ |
| Editar qualquer agendamento | ✅ |
| Ver clientes | ✅ |
| Criar/Editar/Excluir clientes | ✅ |
| Ver serviços | ✅ |
| Criar/Editar/Excluir serviços | ✅ |
| Ver funcionários | ✅ |
| Criar/Editar/Excluir funcionários | ✅ |
| Acessar vendas | ✅ |
| Criar/Editar vendas | ✅ |
| Ver relatórios | ✅ |
| Meus Horários | ❌ (não aparece) |

---

### 👩‍💼 RECEPCIONISTA
**Pode gerenciar clientes e agendamentos, mas não edita serviços/funcionários**

| Funcionalidade | Permissão |
|---|:---:|
| Ver todos os agendamentos | ✅ |
| Criar agendamentos | ✅ |
| Editar agendamentos | ❌ |
| Ver clientes | ✅ |
| Criar/Editar/Excluir clientes | ✅ |
| Ver serviços | ✅ Ver apenas |
| Criar/Editar/Excluir serviços | ❌ |
| Ver funcionários | ✅ Ver apenas |
| Criar/Editar/Excluir funcionários | ❌ |
| Acessar vendas | ✅ |
| Criar/Editar vendas | ✅ |
| Ver relatórios | ✅ Ver apenas |
| Meus Horários | ❌ (não aparece) |

---

### 💅 MANICURE
**Pode VER clientes, serviços e relatórios, mas NÃO pode editar**

| Funcionalidade | Permissão |
|---|:---:|
| Ver próprios agendamentos | ✅ |
| Ver todos agendamentos | ❌ |
| Criar agendamentos | ❌ |
| Editar agendamentos | ❌ |
| Ver clientes | ✅ Ver apenas |
| Criar/Editar/Excluir clientes | ❌ |
| Ver serviços | ✅ Ver apenas |
| Criar/Editar/Excluir serviços | ❌ |
| Ver funcionários | ❌ (não aparece) |
| Acessar vendas | ❌ (não aparece) |
| Ver relatórios | ✅ Ver apenas |
| Meus Horários | ✅ |
| Criar solicitações de folga | ✅ |

**Vê no menu:**
- ✅ Calendário
- ✅ Clientes (sem botões de editar/excluir)
- ✅ Serviços (sem botões de editar/excluir)
- ✅ Relatórios
- ✅ Meus Horários

**NÃO vê no menu:**
- ❌ Funcionários
- ❌ Vendas
- ❌ Botão "Novo Agendamento"
- ❌ Botão "Novo Cliente"
- ❌ Botão "Novo Serviço"

---

### 💇‍♀️ CABELEIREIRA
**Exatamente as MESMAS permissões da Manicure**

| Funcionalidade | Permissão |
|---|:---:|
| Ver próprios agendamentos | ✅ |
| Ver todos agendamentos | ❌ |
| Criar agendamentos | ❌ |
| Editar agendamentos | ❌ |
| Ver clientes | ✅ Ver apenas |
| Criar/Editar/Excluir clientes | ❌ |
| Ver serviços | ✅ Ver apenas |
| Criar/Editar/Excluir serviços | ❌ |
| Ver funcionários | ❌ (não aparece) |
| Acessar vendas | ❌ (não aparece) |
| Ver relatórios | ✅ Ver apenas |
| Meus Horários | ✅ |
| Criar solicitações de folga | ✅ |

**Vê no menu:**
- ✅ Calendário
- ✅ Clientes (sem botões de editar/excluir)
- ✅ Serviços (sem botões de editar/excluir)
- ✅ Relatórios
- ✅ Meus Horários

**NÃO vê no menu:**
- ❌ Funcionários
- ❌ Vendas
- ❌ Botão "Novo Agendamento"
- ❌ Botão "Novo Cliente"
- ❌ Botão "Novo Serviço"

---

## 🔒 Resumo das Proteções Implementadas

### 1. **Visualização de Menu**
```javascript
setupUIPermissions() {
    menuItems = {
        'clientsView': true,                    // TODOS veem
        'servicesView': true,                   // TODOS veem
        'staffView': canViewStaff(),           // Admin + Recepcionista
        'reportsView': true,                    // TODOS veem
        'productsView': canAccessSales(),      // Admin + Recepcionista
        'myScheduleView': isStaffMember()      // Manicure + Cabeleireira
    }
}
```

### 2. **Botões de Ação**
```javascript
// Botão "Novo Cliente" - apenas admin/recepcionista
newClientBtn.display = canEditClients() ? 'block' : 'none';

// Botão "Novo Serviço" - apenas admin
newServiceBtn.display = canEditServices() ? 'block' : 'none';

// Botão "Novo Agendamento" - apenas admin/recepcionista
newAppointmentBtn.display = canCreateAppointments() ? 'block' : 'none';

// Botão "Novo Produto" - apenas admin/recepcionista
newProductBtn.display = canAccessSales() ? 'block' : 'none';
```

### 3. **Botões de Editar/Excluir nas Listas**
```javascript
// Em renderServices()
${canEdit ? `botões de editar/excluir` : `badge "Somente visualização"`}

// Em renderClients()
${canEdit ? `botões de editar/excluir` : `badge "Somente visualização"`}

// Em renderStaff()
${canEdit ? `botões de editar/excluir` : `badge "Somente visualização"`}
```

### 4. **Funções Globais de Edição**
```javascript
window.editClient = function(clientId) {
    if (!canEditClients()) {
        showNotification('Você não tem permissão...', 'error');
        return;
    }
    // ... editar
};
```

### 5. **Modais de Formulário**
```javascript
function showClientModal(client) {
    if (!canEditClients()) {
        showNotification('Você não tem permissão...', 'error');
        return;
    }
    // ... mostrar modal
}
```

---

## 📊 Tabela Comparativa

| Recurso | Admin | Recepcionista | Manicure | Cabeleireira |
|---------|:-----:|:-------------:|:--------:|:------------:|
| **CALENDÁRIO** |
| Ver todos | ✅ | ✅ | ❌ | ❌ |
| Ver próprios | ✅ | ✅ | ✅ | ✅ |
| Criar agendamento | ✅ | ✅ | ❌ | ❌ |
| Editar agendamento | ✅ | ❌ | ❌ | ❌ |
| **CLIENTES** |
| Ver lista | ✅ | ✅ | ✅ | ✅ |
| Criar | ✅ | ✅ | ❌ | ❌ |
| Editar | ✅ | ✅ | ❌ | ❌ |
| Excluir | ✅ | ✅ | ❌ | ❌ |
| **SERVIÇOS** |
| Ver lista | ✅ | ✅ | ✅ | ✅ |
| Criar | ✅ | ❌ | ❌ | ❌ |
| Editar | ✅ | ❌ | ❌ | ❌ |
| Excluir | ✅ | ❌ | ❌ | ❌ |
| **FUNCIONÁRIOS** |
| Ver lista | ✅ | ✅ | ❌ | ❌ |
| Criar | ✅ | ❌ | ❌ | ❌ |
| Editar | ✅ | ❌ | ❌ | ❌ |
| Excluir | ✅ | ❌ | ❌ | ❌ |
| **VENDAS** |
| Ver/Registrar | ✅ | ✅ | ❌ | ❌ |
| **RELATÓRIOS** |
| Visualizar | ✅ | ✅ | ✅ | ✅ |
| **MEUS HORÁRIOS** |
| Acessar | ❌ | ❌ | ✅ | ✅ |

---

## ✅ Checklist de Testes

### Teste como MANICURE/CABELEIREIRA:
- [ ] Vê menu "Clientes"
- [ ] Vê menu "Serviços"
- [ ] Vê menu "Relatórios"
- [ ] Vê menu "Meus Horários"
- [ ] **NÃO** vê menu "Funcionários"
- [ ] **NÃO** vê menu "Vendas"
- [ ] **NÃO** vê botão "Novo Agendamento"
- [ ] **NÃO** vê botão "Novo Cliente"
- [ ] **NÃO** vê botão "Novo Serviço"
- [ ] Ao entrar em "Clientes", vê a lista completa
- [ ] **NÃO** vê botões "Editar" e "Excluir" em clientes
- [ ] Ao entrar em "Serviços", vê a lista completa
- [ ] **NÃO** vê botões "Editar" e "Excluir" em serviços
- [ ] Consegue acessar "Relatórios" e ver dados
- [ ] Consegue criar solicitações de folga

### Teste como RECEPCIONISTA:
- [ ] Vê todos os menus exceto "Meus Horários"
- [ ] Vê botão "Novo Agendamento"
- [ ] Vê botão "Novo Cliente"
- [ ] **NÃO** vê botão "Novo Serviço"
- [ ] **NÃO** vê botão "Novo Funcionário"
- [ ] Consegue editar clientes
- [ ] Consegue registrar vendas
- [ ] Consegue ver relatórios
- [ ] Consegue ver serviços mas não editar
- [ ] Consegue ver funcionários mas não editar

### Teste como ADMIN:
- [ ] Vê TODOS os menus exceto "Meus Horários"
- [ ] Vê TODOS os botões de ação
- [ ] Consegue editar TUDO
- [ ] Consegue criar/editar/excluir em todas as seções

---

## 🚀 Por que essa estrutura?

### Manicures e Cabeleireiras precisam ver:
1. **Clientes** - Para saber quem vai atender, dados de contato, preferências
2. **Serviços** - Para saber preços, durações, descrições dos serviços oferecidos
3. **Relatórios** - Para acompanhar desempenho individual, metas, comissões

### Manicures e Cabeleireiras NÃO podem:
1. **Editar clientes** - Evita alterações não autorizadas
2. **Editar serviços** - Apenas admin controla preços e ofertas
3. **Ver vendas** - Dados financeiros sensíveis
4. **Ver funcionários** - Privacidade de dados de outros colaboradores
5. **Criar agendamentos** - Evita conflitos e garante controle centralizado

---

## 🔐 Próximos Passos Recomendados

1. **Testar cada cargo** conforme checklist acima
2. **Configurar RLS no Supabase** para proteção no backend
3. **Adicionar logs de auditoria** para rastrear ações críticas
4. **Revisar relatórios** - decidir quais dados manicures/cabeleireiras podem ver
