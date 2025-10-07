# 🚀 FEATURES - Documentação Completa de Funcionalidades

## 📋 Índice

- [Sistema de Agendamentos](#-sistema-de-agendamentos)
- [Gestão de Clientes](#-gestão-de-clientes)
- [Gestão de Serviços](#-gestão-de-serviços)
- [Gestão de Funcionários](#-gestão-de-funcionários)
- [Recursos Nativos](#-recursos-nativos-apk)
- [Sistema de Permissões](#-sistema-de-permissões)
- [Personalização](#-personalização)

---

## 📅 Sistema de Agendamentos

### Criar Agendamento
**Quem pode:** Admin, Recepcionista

**Como funciona:**
1. Clique em "Novo Agendamento" ou em um horário vazio no calendário
2. Selecione o funcionário
3. **NOVO:** Duração atualiza automaticamente conforme o cargo:
   - **Manicures**: 45, 90, 135, 180 minutos
   - **Cabeleireiras**: 30, 60, 90, 120 minutos
4. Escolha cliente, serviço e observações
5. Salvar

**Funcionalidades:**
- ✅ Validação de conflitos de horário
- ✅ Bloqueio automático de horários ocupados
- ✅ Respeita pausas para almoço
- ✅ Considera horários customizados do funcionário
- ✅ Impede agendamento em datas passadas (exceto admin)

### Editar Agendamento
**Quem pode:** Admin, Recepcionista

**Como funciona:**
- Clique no agendamento existente
- Modifique os campos desejados
- Salvar alterações

**Validações:**
- Verifica conflitos com novos horários
- Mantém histórico de alterações
- Atualiza status automaticamente

### Status de Agendamento
- 🟡 **Pending** (Pendente) - Agendamento criado
- 🟢 **Confirmed** (Confirmado) - Cliente confirmou presença
- 🔵 **In Progress** (Em Andamento) - Atendimento iniciado
- ✅ **Completed** (Concluído) - Atendimento finalizado
- ❌ **Cancelled** (Cancelado) - Agendamento cancelado
- 🚫 **No Show** (Não Compareceu) - Cliente faltou

### Visualizações do Calendário
- **Mensal**: Visão geral do mês
- **Semanal**: Detalhes da semana
- **Diária**: Todos os horários do dia

---

## 👥 Gestão de Clientes

### Cadastrar Cliente
**Quem pode:** Admin, Recepcionista

**Campos:**
- Nome completo *
- Telefone *
- Email
- Observações

**Funcionalidades:**
- ✅ Validação de telefone único
- ✅ Busca rápida por nome/telefone
- ✅ Histórico de atendimentos
- ✅ Total gasto pelo cliente

### Editar Cliente
- Atualizar informações
- Adicionar observações
- Ver histórico completo

### Deletar Cliente
**Apenas Admin**
- Confirmação obrigatória
- Remove apenas se não houver agendamentos futuros

---

## 💅 Gestão de Serviços

### Criar Serviço
**Quem pode:** Admin

**Campos:**
- Nome do serviço *
- Descrição
- Preço *
- Duração estimada *
- Comissão (%) *

**Exemplos:**
- Manicure Simples - R$ 30,00 - 45min - 40%
- Corte Feminino - R$ 50,00 - 60min - 50%
- Escova - R$ 40,00 - 30min - 45%

### Editar Serviço
- Atualizar preços
- Modificar comissões
- Ajustar durações

### Produtos (Comissão Fixa)
- Cadastro de produtos vendidos
- Comissão fixa em reais (não porcentagem)
- Controle de estoque (planejado)

---

## 👩‍💼 Gestão de Funcionários

### Cadastrar Funcionário
**Quem pode:** Admin

**Campos:**
- Nome completo *
- Email * (usado para login)
- Senha *
- Cargo * (manicurist, hairdresser, admin, receptionist)
- Telefone
- Foto de perfil

**Cargos:**
- **Admin** - Acesso total
- **Receptionist** - Criar agendamentos, ver todos
- **Manicurist** - Ver apenas seus agendamentos
- **Hairdresser** - Ver apenas seus agendamentos

### Horários Customizados
**Quem pode:** Admin

**Funcionalidades:**
- ✅ Definir horário diferente para cada funcionário
- ✅ Configurar dias de folga
- ✅ Pausas personalizadas para almoço
- ✅ Horários especiais por data (ex: feriados)

**Como configurar:**
1. Clique no funcionário
2. "Configurar Horários"
3. Defina:
   - Horário de entrada
   - Horário de saída
   - Pausa para almoço (início/fim)
   - Dias da semana que trabalha

### Foto de Perfil
**Como adicionar:**
1. Editar perfil
2. Clique em "Alterar Foto"
3. **No APK:** Escolhe galeria ou câmera
4. **No Web:** Seleciona arquivo do computador
5. Imagem é salva no Supabase Storage

---

## 📱 Recursos Nativos (APK)

### 🔄 Pull-to-Refresh
**Como usar:**
1. Na tela principal, role até o topo
2. Puxe para baixo
3. Solte quando aparecer "Solte para atualizar"
4. App recarrega todos os dados

**Funciona em:**
- Calendário
- Lista de clientes
- Lista de serviços

### 🔔 Notificações Nativas
**Como ativar:**
1. Vá em Configurações
2. Ative "Habilitar Notificações"
3. Sistema Android/iOS pede permissão
4. Aceite a permissão
5. Recebe notificação de teste

**Tipos de notificações:**
- Novo agendamento criado
- Lembrete 1 hora antes do horário
- Confirmação de agendamento
- Cancelamento de horário

**Diferencial:**
- ✅ Funciona com app fechado
- ✅ Som e vibração
- ✅ Ícone do app na notificação
- ✅ Abre o app ao clicar

### 📸 Galeria e Câmera
**Onde usar:**
- Foto de perfil do funcionário
- Foto de produtos (planejado)

**Opções:**
1. **Tirar foto** - Abre câmera nativa
2. **Galeria** - Abre galeria de fotos
3. **Perguntar** - Mostra opções

**Funcionalidades:**
- ✅ Edição antes de enviar
- ✅ Recorte automático
- ✅ Compressão de imagem
- ✅ Upload para Supabase Storage

### 📳 Vibração (Haptic Feedback)
Pequenas vibrações ao:
- Puxar para atualizar
- Salvar agendamento
- Confirmar ação importante

---

## 🔒 Sistema de Permissões

### Admin
**Acesso Total:**
- ✅ Criar/editar/deletar tudo
- ✅ Ver todos os agendamentos
- ✅ Configurar sistema
- ✅ Gerenciar funcionários
- ✅ Criar agendamentos em datas passadas
- ✅ Ver comissões e relatórios

### Receptionist (Recepcionista)
**Acesso Médio:**
- ✅ Criar/editar agendamentos
- ✅ Cadastrar clientes
- ✅ Ver todos os agendamentos
- ❌ Não pode deletar agendamentos
- ❌ Não pode gerenciar funcionários
- ❌ Não pode ver comissões

### Manicurist/Hairdresser (Profissionais)
**Acesso Limitado:**
- ✅ Ver apenas SEUS agendamentos
- ✅ Atualizar status dos agendamentos
- ✅ Editar seu perfil
- ❌ Não pode criar novos agendamentos
- ❌ Não vê agendamentos de outros
- ❌ Não pode deletar nada

### Validações de Permissão
O sistema valida permissões em:
- Frontend (interface)
- Backend (Supabase RLS - Row Level Security)

**Exemplo de RLS:**
```sql
-- Funcionários só veem seus próprios agendamentos
CREATE POLICY "staff_own_appointments" ON appointments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('manicurist', 'hairdresser')
    ) AND staff_id = auth.uid()
  );
```

---

## 🎨 Personalização

### Temas (Claro/Escuro)
**Como alternar:**
- Clique no ícone ☀️/🌙 no topo
- Preferência salva no localStorage
- Muda todas as cores automaticamente

**Cores do tema:**
- Modo Claro: Fundo branco, texto preto
- Modo Escuro: Fundo cinza escuro, texto branco
- Roxo mantém em ambos (#8a4fff)

### Idiomas
**Suportados:**
- 🇧🇷 Português (Brasil)
- 🇺🇸 Inglês (Estados Unidos)

**Como trocar:**
1. Configurações
2. Selecionar idioma
3. Interface atualiza instantaneamente

**Textos traduzidos:**
- Todos os menus
- Botões
- Mensagens de erro
- Notificações

### Responsividade

**Desktop (>768px):**
- Sidebar fixa
- Calendário grande
- Múltiplas colunas

**Tablet (≤768px):**
- Sidebar retrátil
- Calendário médio
- Fontes menores

**Mobile (≤480px):**
- Menu hambúrguer
- Calendário compacto
- Botões em coluna
- Touch targets 44x44px

---

## 📊 Relatórios e Comissões

### Cálculo de Comissões
**Fórmula:**
```
Comissão = Preço do Serviço × (% Comissão ÷ 100)
```

**Exemplo:**
- Serviço: Manicure - R$ 30,00
- Comissão: 40%
- Valor funcionário: R$ 12,00

### Relatório Mensal
**Quem pode:** Admin

**Informações:**
- Total de atendimentos
- Faturamento total
- Comissões por funcionário
- Serviços mais vendidos
- Clientes mais frequentes

---

## 🔮 Recursos Futuros (Roadmap)

### Em Desenvolvimento
- [ ] App para clientes (agendamento online)
- [ ] Sistema de cashback/pontos
- [ ] Controle de estoque de produtos
- [ ] Integração com WhatsApp
- [ ] Exportar relatórios (PDF/Excel)

### Planejado
- [ ] Sistema de avaliações
- [ ] Programa de fidelidade
- [ ] Multi-salão (franquias)
- [ ] Dashboard analytics
- [ ] Backup automático

---

## 💡 Dicas de Uso

### Para Melhor Performance
1. Ative notificações para não perder agendamentos
2. Use pull-to-refresh para dados sempre atualizados
3. Mantenha fotos de perfil para melhor identificação
4. Configure horários customizados desde o início

### Para Melhor Organização
1. Use cores nos status (pending, confirmed, etc)
2. Adicione observações nos agendamentos
3. Cadastre telefone correto dos clientes
4. Revise agendamentos diariamente

### Boas Práticas
- ✅ Confirme agendamentos 1 dia antes
- ✅ Marque "No Show" quando cliente faltar
- ✅ Atualize status em tempo real
- ✅ Faça backup semanal (export planejado)

---

**Próximo passo:** Veja [CHANGELOG.md](CHANGELOG.md) para histórico de versões!
