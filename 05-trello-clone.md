# Desafio 5: Clone do Trello

## Projeto

Clone funcional do Trello. Boards, listas e cards com drag-and-drop, labels, ordenação persistente e múltiplos boards por usuário. Backend completo com autenticação.

## Stack

- **Frontend:** React + TypeScript + biblioteca de UI (livre -- decisão do dev, mas obrigatório usar uma)
- **Backend:** livre (Node.js, Python, Go, etc. -- decisão do dev) + PostgreSQL
- **Drag-and-drop:** dnd-kit

## Features

### Boards
- Criar board com nome e cor de fundo
- Listar boards do usuário
- Abrir board (carrega listas e cards)
- Editar nome/cor do board
- Deletar board (com confirmação)

### Listas
- Criar lista dentro de um board
- Renomear lista
- Reordenar listas (drag-and-drop horizontal)
- Deletar lista (move cards para arquivo ou deleta junto)

### Cards
- Criar card com título
- Editar card: título, descrição (markdown), labels, data de entrega
- Mover card entre listas (drag-and-drop vertical e horizontal)
- Reordenar cards dentro da mesma lista
- Labels com cores e nomes customizáveis por board
- Checklist dentro do card (itens com checkbox)
- Deletar card

### Drag-and-Drop
- Arrastar card entre listas
- Arrastar card para reordenar dentro da lista
- Arrastar lista para reordenar no board
- Ordenação persistida no backend (não resetar ao recarregar)

### Filtros
- Filtrar cards por label
- Filtrar cards por data de entrega (atrasados, hoje, esta semana)
- Buscar card por texto (título ou descrição)

### Autenticação
- Registro com email e senha
- Login/logout
- Cada usuário vê apenas seus boards

### Backend
- CRUD completo: boards, listas, cards, labels, checklist items
- Autenticação (JWT)
- Ordenação persistida: campo de posição em listas e cards, atualizado em batch no drag
- API REST: auth (register, login), boards (CRUD), lists (CRUD + reorder), cards (CRUD + move + reorder), labels (CRUD)

## Conceitos Obrigatórios

### Processo
- CLAUDE.md configurado no projeto antes de codar
- Plano escrito antes de implementar
- Conventional Commits em pt-BR
- Git workflow limpo

### Arquitetura
- Código organizado por domínio (auth/, boards/, lists/, cards/, labels/)
- Lógica de reordenação isolada (algoritmo de posição, não espalhado nos controllers)
- Autenticação como middleware reutilizável
- Modelo de dados normalizado (board → lists → cards → labels, sem duplicação)
- Backend: rotas, controllers, serviços, middleware

### Frontend
- Responsivo (boards legíveis em mobile, listas empilham verticalmente)
- Componentes reutilizáveis (board-card, list-column, card-modal, label-badge)
- Zero style inline
- Design consistente
- Estados de loading, vazio e erro tratados em toda tela

### Testes
- Testes para lógica de reordenação (mover card da posição 3 para 1 atualiza posições corretamente)
- Testes para autenticação (token válido acessa, inválido retorna 401)
- Testes para filtros (filtrar por label retorna apenas cards com aquele label)
- Teste de regressão: criar board → lista → card → reordenar → recarregar → ordem mantida
