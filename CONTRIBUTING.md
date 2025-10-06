# 🤝 Contribuindo para o Sistema de Agendamento

Obrigado por considerar contribuir com nosso projeto! 🎉

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Posso Contribuir?](#como-posso-contribuir)
- [Processo de Desenvolvimento](#processo-de-desenvolvimento)
- [Guia de Estilo](#guia-de-estilo)
- [Commits](#commits)
- [Pull Requests](#pull-requests)

---

## 📜 Código de Conduta

Este projeto adere a um código de conduta. Ao participar, espera-se que você mantenha este código. Por favor, reporte comportamentos inaceitáveis.

### Nossos Padrões

- ✅ Usar linguagem acolhedora e inclusiva
- ✅ Respeitar pontos de vista e experiências diferentes
- ✅ Aceitar críticas construtivas graciosamente
- ✅ Focar no que é melhor para a comunidade
- ✅ Mostrar empatia com outros membros da comunidade

---

## 🚀 Como Posso Contribuir?

### 🐛 Reportando Bugs

Antes de criar um report de bug:
- Verifique se já não existe uma issue sobre o problema
- Determine qual repositório o bug pertence
- Reúna informações sobre o bug

Quando criar um bug report, inclua:
```markdown
**Descrição do Bug**
Uma descrição clara do que é o bug.

**Passos para Reproduzir**
1. Vá para '...'
2. Clique em '....'
3. Role até '....'
4. Veja o erro

**Comportamento Esperado**
O que você esperava que acontecesse.

**Screenshots**
Se aplicável, adicione screenshots.

**Ambiente:**
 - OS: [ex: Windows 11]
 - Navegador: [ex: Chrome 120]
 - Versão: [ex: 2.0.0]
```

### 💡 Sugerindo Melhorias

Sugestões de melhorias são rastreadas como GitHub issues. Ao criar uma sugestão, inclua:

- **Título claro e descritivo**
- **Descrição detalhada** da funcionalidade sugerida
- **Exemplos de uso** se possível
- **Por que seria útil** para a maioria dos usuários

### 📝 Contribuindo com Código

1. **Fork o repositório**
2. **Clone seu fork**
   ```bash
   git clone https://github.com/seu-usuario/agendamento-salao.git
   cd agendamento-salao
   ```

3. **Crie uma branch**
   ```bash
   git checkout -b feature/minha-nova-funcionalidade
   ```

4. **Faça suas mudanças**
5. **Teste suas mudanças**
6. **Commit com mensagem descritiva**
7. **Push para seu fork**
   ```bash
   git push origin feature/minha-nova-funcionalidade
   ```

8. **Abra um Pull Request**

---

## 🔧 Processo de Desenvolvimento

### Setup Local

1. **Clone o repositório**
   ```bash
   git clone https://github.com/LELEOU/App-de-Agendamento.git
   cd App-de-Agendamento
   ```

2. **Instale as dependências**
   ```bash
   cd app
   npm install
   ```

3. **Configure o Supabase**
   - Veja [`docs/CONFIGURAÇÃO-SUPABASE.md`](docs/CONFIGURAÇÃO-SUPABASE.md)

4. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

### Estrutura do Projeto

```
📁 app/
├── src/
│   ├── js/
│   │   ├── app-supabase-final.js  # Lógica principal
│   │   └── supabase-config.js     # Configuração
│   ├── css/
│   │   └── style.css              # Estilos
│   ├── assets/                    # Imagens, ícones
│   └── database-setup.sql         # Schema do banco
├── package.json
└── vite.config.ts

📁 docs/                           # Documentação
📁 .github/                        # Workflows CI/CD
```

---

## 🎨 Guia de Estilo

### JavaScript

- Use **ES6+** features
- Use **const** por padrão, **let** quando necessário
- Evite **var**
- Use **arrow functions** quando apropriado
- Use **template literals** ao invés de concatenação

```javascript
// ✅ Bom
const getUserName = (user) => `Nome: ${user.name}`;

// ❌ Ruim
var getUserName = function(user) {
    return 'Nome: ' + user.name;
};
```

### CSS

- Use **classes utilitárias do Tailwind** quando possível
- Use **variáveis CSS** para cores e temas
- Prefixe classes customizadas com namespace

```css
/* ✅ Bom */
.app-button {
    @apply px-4 py-2 bg-primary text-white rounded;
}

/* ❌ Ruim */
.button {
    padding: 0.5rem 1rem;
    background-color: #8a4fff;
}
```

### SQL

- Use **UPPER CASE** para comandos SQL
- Use **snake_case** para nomes de tabelas e colunas
- Sempre adicione comentários

```sql
-- ✅ Bom
CREATE TABLE appointment_handoffs (
    id UUID PRIMARY KEY,
    appointment_id UUID NOT NULL, -- FK para appointments
    created_at TIMESTAMP DEFAULT NOW()
);

-- ❌ Ruim
create table AppointmentHandoffs (
    ID uuid primary key,
    appointmentId uuid
);
```

---

## 📝 Commits

### Mensagens de Commit

Use o padrão **Conventional Commits**:

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

**Tipos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Mudanças na documentação
- `style`: Formatação, ponto-e-vírgula faltando, etc
- `refactor`: Refatoração de código
- `test`: Adição de testes
- `chore`: Tarefas de manutenção

**Exemplos:**

```bash
feat(agendamento): adiciona sistema de slots múltiplos

Implementa duração variável para agendamentos (30-180min)
- Adiciona campo duration na tabela appointments
- Atualiza formulário com opções de duração
- Implementa detecção de conflitos multi-slot

Closes #123
```

```bash
fix(calendar): corrige renderização de blocos grandes

Agendamentos com 90min+ agora aparecem como bloco único
ao invés de slots separados.

Fixes #456
```

---

## 🔀 Pull Requests

### Checklist

Antes de abrir um PR, verifique:

- [ ] O código segue o guia de estilo do projeto
- [ ] Você executou lint e testes
- [ ] Você adicionou testes para novas funcionalidades
- [ ] Você atualizou a documentação
- [ ] Todos os testes passam
- [ ] O PR resolve apenas UMA issue/funcionalidade

### Template de PR

```markdown
## Descrição
Breve descrição das mudanças.

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova funcionalidade
- [ ] Breaking change
- [ ] Documentação

## Como Testar
1. Faça checkout desta branch
2. Execute `npm install`
3. Execute `npm run dev`
4. Teste [descrever testes]

## Screenshots (se aplicável)

## Issues Relacionadas
Closes #123
```

### Processo de Review

1. Ao menos 1 aprovação é necessária
2. Todos os checks de CI devem passar
3. Código deve seguir padrões estabelecidos
4. Documentação deve estar atualizada

---

## 🧪 Testes

### Executando Testes

```bash
# Testes unitários
npm test

# Testes e2e
npm run test:e2e

# Coverage
npm run test:coverage
```

### Escrevendo Testes

```javascript
// Exemplo de teste
describe('checkTimeConflict', () => {
    it('deve retornar true quando há conflito', async () => {
        const hasConflict = await checkTimeConflict(
            'staff-id',
            '2025-10-06',
            '10:00',
            30
        );
        expect(hasConflict).toBe(true);
    });
});
```

---

## 📚 Documentação

### Atualizando Documentação

Ao adicionar nova funcionalidade:

1. Atualize o **README.md** se necessário
2. Adicione/atualize arquivo em **docs/** 
3. Atualize o **docs/INDEX.md**
4. Adicione exemplos de código
5. Inclua screenshots se aplicável

### Estrutura de Documentação

```markdown
# Título da Funcionalidade

## O que é?
Breve descrição

## Como Usar
Passo a passo

## Exemplo
Código de exemplo

## FAQ
Perguntas frequentes
```

---

## 🏆 Reconhecimento

Contribuidores serão adicionados ao README.md e terão seus commits reconhecidos no changelog.

---

## 💬 Comunidade

- 💬 **Discord:** [Link do servidor]
- 📧 **Email:** suporte@seu-dominio.com
- 🐦 **Twitter:** [@seu_usuario](https://twitter.com/seu_usuario)

---

## 📄 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto (MIT).

---

## ❓ Dúvidas?

Não hesite em abrir uma issue com a tag `question` ou entrar em contato com a equipe!

---

<div align="center">

**Obrigado por contribuir! 🎉**

Feito com ❤️ pela comunidade

[⬆ Voltar ao topo](#-contribuindo-para-o-sistema-de-agendamento)

</div>
