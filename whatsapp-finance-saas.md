# Visão Geral
Criar uma interface moderna de web app SaaS para uma plataforma de controle financeiro baseada no WhatsApp. O produto permite que os usuários controlem suas finanças usando mensagens do WhatsApp e enviando recibos, que são processados por IA e exibidos em um painel React limpo e profissional semelhante a gigantes fintech como Stripe ou Brex.

# Tipo de Projeto
WEB

# Critérios de Sucesso
- Interface fintech moderna e totalmente responsiva (tema verde/azul, muito espaço em branco, microinterações suaves).
- Dashboard com cartões de resumo no topo, seções de Contas, Transações, Processamento de Recibos por IA, Assistente WhatsApp e Relatórios.
- Suporte a dark mode nativo.
- Arquitetura de componentes de alta qualidade utilizando TailwindCSS (ou similar) e ícones Lucide.

> [!WARNING]
> # Socratic Gate (Revisão do Usuário Necessária)
> Antes de prosseguirmos para a implementação, por favor esclareça as seguintes decisões arquiteturais:
> 
> ### 1️⃣ **Autenticação & Vinculação com WhatsApp**
> **Pergunta:** Como os usuários acessarão o painel web?
> **Por que isso importa:**
> - Afeta a arquitetura do banco de dados e o fluxo de login.
> **Opções:**
> | Opção | Prós | Contras | Melhor Para |
> |--------|------|------|----------|
> | E-mail/Senha Padrão | Simples de construir, base sólida | Usuário precisa vincular WhatsApp depois | Separação entre web e chat |
> | Login OTP via WhatsApp | Super prático, natural para o app | Difícil de implementar (depende da API do WP) | Apps 100% WhatsApp |
> **Se não especificado:** Implementaremos autenticação padrão com **E-mail/Senha** e uma tela de "Vincular WhatsApp".
> 
> ### 2️⃣ **Fluxo de Fallback para Extração da IA**
> **Pergunta:** Quando a IA identificar uma informação errada (ex: valor da nota), onde o usuário corrige isso?
> **Por que isso importa:**
> - Define onde a complexidade do sistema irá se concentrar.
> **Opções:**
> | Opção | Prós | Contras | Melhor Para |
> |--------|------|------|----------|
> | Correção Assíncrona no App Web | UI robusta para validar itens complexos | Usuário precisa sair do chat | Preenchimento detalhado |
> | Correção no Chat (WhatsApp) | Mantém o usuário "no fluxo" | Lógica complexa de conversação | UX focada 100% em mobile |
> **Se não especificado:** A transação ficará como "Pendente de Revisão" e o usuário corrige de forma fácil no **App Web**.

# Stack Tecnológico
- **Framework:** React / Vite (ótimo para SPAs SaaS) com TypeScript.
- **Estilização:** Tailwind CSS (configurado com Cores da Marca: Verde: #16A34A, Azul: #2563EB).
- **Ícones:** `lucide-react`.
- **Componentes de UI:** Cartões arredondados e sombras suaves no padrão moderno do mercado.
- **Gráficos:** `recharts` para fluxo de caixa, gráfico de pizza de despesas e barras.

# Estrutura de Arquivos Planejada
```text
src/
├── components/          # Componentes reutilizáveis (Botões, Cartões, Campos)
├── layouts/             # DashboardLayout (Menu Lateral e Cabeçalho)
├── pages/               # Páginas da aplicação
│   ├── Dashboard/       # Cartões de Resumo e Visão Rápida
│   ├── Accounts/        # Contas bancárias
│   ├── Transactions/    # Lista/Tabela de transações com filtros
│   ├── Receipts/        # Leitor de Recibos/IA
│   ├── Assistant/       # Visão de Chat do WhatsApp
│   ├── Reports/         # Relatórios e gráficos (Recharts)
│   └── Settings/        # Configurações do usuário
├── styles/              # CSS global e tokens do Tailwind
└── utils/               # Formatação de campos (moeda, datas)
```

# Detalhamento das Tarefas
1. **Configurar Projeto e Tema (P0)**
   - Agente: `frontend-specialist`
   - Skill: `app-builder` / `tailwind-patterns`
   - Output: Ambiente base Vite+React rodando e tipografia (Inter) incorporada.
   - Verify: `npm run dev` rodando sem erros.
2. **Construir Layout Global (P1)**
   - Agente: `frontend-specialist`
   - Skill: `frontend-design`
   - Output: Sidebar responsivo com links e Header global.
   - Verify: Troca de layout limpa em mobile / desktop.
3. **Desenvolver o Dashboard e Gráficos Básicos (P1)**
   - Agente: `frontend-specialist`
   - Input: Adicionar os cartões financeiros e as tendências (+12%).
4. **Construir Páginas de Contas e Transações (P2)**
   - Input: Tabela estruturada (Estilo Extrato) com filtros e iconografia limpa.
5. **Desenvolver a parte do Assistente IA e Recibos (P2)**
   - Input: Mock das telinhas de Chat Assistant (como se fossem mensagens WhatsApp) e tela de extração de campos (Valor, Loja, Categoria, Confiança IA).
6. **Desenvolver Gráficos e Relatórios Detalhados (P3)**
   - Input: Gráficos de barra usando Recharts com suporte a tema escuro.

# Fase X: Verificação Final
- [ ] Rodar `npm run lint` para validação de erros sintáticos.
- [ ] Validar Dark Mode completo de forma manual visualmente.
- [ ] Checar uso de cores para não infringir as regras de UI estabelecidas pelo agente (evitar templates clichês, utilizar estilo SaaS premium).
