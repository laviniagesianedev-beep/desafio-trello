# Boardy - Trello Clone

Clone funcional do Trello. Boards, listas e cards com drag-and-drop, labels, checklist, ordenação persistente e múltiplos boards por usuário.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 + TypeScript, Ant Design 5, dnd-kit, Zustand, Vite |
| Backend | Laravel 10, PHP 8.2, PostgreSQL, Sanctum |
| Dev | Docker Compose |

## Arquitetura

### Frontend (`frontend/`)

```
src/
├── pages/          # LoginPage, RegisterPage, DashboardPage, BoardPage
├── components/     # Componentes reutilizáveis (BoardCard, ListColumn, CardModal, LabelBadge)
├── services/       # API calls (api.ts)
├── store/          # Zustand (authStore, boardStore)
└── theme/          # boardyTheme.ts, index.css (CSS variables)
```

### Backend (`backend/`)

```
app/
├── Http/Controllers/API/   # REST controllers
├── Services/              # ReorderService, lógica de negócio isolada
└── Models/                # Eloquent models
```

## Portas

| Serviço | Porta |
|---------|-------|
| Frontend | 3000 |
| Backend | 8000 |
| PostgreSQL | 5432 |

## Comandos

```bash
# Desenvolvimento
docker compose -f docker-compose.simple.yml up -d

# Backend
docker compose -f docker-compose.simple.yml exec backend php artisan test
docker compose -f docker-compose.simple.yml exec backend php artisan migrate
docker compose -f docker-compose.simple.yml exec backend php artisan migrate:fresh --seed

# Frontend
cd frontend && npm run dev
cd frontend && npm run build
cd frontend && npm test
```

## Convenções

### Idioma
- Todo texto de UI em **português (pt-BR)** com acentuação correta.
- Commits conventional em pt-BR: `feat: adicionar filtro de labels`, `fix: corrigir ordenação de cards`.

### CSS
- Variáveis CSS definidas em `frontend/src/index.css` (`--pastel-purple`, `--bg-primary`, etc.).
- Tema Ant Design via `theme/boardyTheme.ts`.
- Fonte: Nunito (Google Fonts).
- **Zero style inline** -- usar classes/tokens.

### Backend
- API REST com autenticação Sanctum.
- ReorderService para lógica de ordenação (isolada dos controllers).
- Migrations idempotentes (`if not exists`).

## Padrões Frontend

- **Estado:** Zustand stores (`authStore`, `boardStore`).
- **API:** `services/api.ts` com axios.
- **DnD:** `@dnd-kit/core` + `@dnd-kit/sortable` para arrastar cards e listas.
- **Modais:** CardModal para criar/editar cards, gestão de membros.

## Padrões Backend

- Controllers em `app/Http/Controllers/API/`.
- ReorderService com lógica de posição (não espalhar nos controllers).
- Sanctum para autenticação stateless.
- Validação de entrada via Form Requests.

## Testes

- Backend: `php artisan test` (Testes para reorder, auth, filtros).
- Frontend: Vitest.
- Regressão: criar board → lista → card → reordenar → recarregar → ordem mantida.

## API Endpoints (Resumo)

| Recurso | Endpoints |
|---------|-----------|
| Auth | POST /api/register, POST /api/login, POST /api/logout |
| Boards | GET, POST /api/boards, GET, PUT, DELETE /api/boards/{id} |
| Lists | GET /api/boards/{id}/lists, POST, PUT, DELETE /api/lists/{id}, POST /api/lists/reorder |
| Cards | GET /api/lists/{id}/cards, POST, PUT, DELETE /api/cards/{id}, POST /api/cards/reorder |
| Labels | CRUD em /api/boards/{id}/labels |

## Regras de Negócio

- Cada usuário vê apenas seus boards.
- Ordenação persistida no backend (não reseta ao recarregar).
- Campo `position` em listas e cards, atualizado em batch no drag.
