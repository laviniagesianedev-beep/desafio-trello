# Boardy - Trello Clone

Clone funcional do Trello. Boards, listas e cards com drag-and-drop, labels, checklist, ordenação persistente, múltiplos boards por usuário e sistema de membros com permissões.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 + TypeScript, Ant Design 5, dnd-kit, Zustand, Vite |
| Backend | Laravel 10, PHP 8.2, PostgreSQL, Sanctum |
| Dev | Docker Compose |

## Funcionalidades

### Quadros
- Criar, editar e excluir quadros
- Cores pastéis personalizáveis
- Arquivar e restaurar quadros
- Sistema de membros com permissões (Admin, Moderador, Normal, Observador)
- Convites por email

### Listas
- Criar, renomear e excluir listas
- Reordenar via drag-and-drop
- Posicionamento persistente

### Cards
- Criar cards com título, descrição (Markdown), labels e data de entrega
- Editar todos os campos
- Mover cards entre listas via drag-and-drop
- Reordenar cards dentro da lista
- Checklist com itens checkáveis
- Arquivar e restaurar cards
- Comentários
- Anexos de arquivos

### Filtros
- Filtrar por label
- Filtrar por data de entrega (atrasados, hoje, esta semana)
- Buscar por texto (título ou descrição)

### Autenticação
- Registro com validação de senha forte
- Login/logout
- Recuperação de senha via email
- Cada usuário vê apenas seus boards

## Portas

| Serviço | Porta |
|---------|-------|
| Frontend | 3000 |
| Backend | 8000 |
| PostgreSQL | 5432 |

## Instalação

### Pré-requisitos
- Docker e Docker Compose
- Node.js 20+ (para desenvolvimento local do frontend)

### Docker (Recomendado)

1. Clone o repositório:
```bash
git clone <repository-url>
cd projeto-trello
```

2. Inicie os containers:
```bash
docker compose -f docker-compose.simple.yml up -d
```

3. Acesse a aplicação:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api

### Desenvolvimento Local

#### Backend
```bash
cd backend

# Instalar dependências
composer install

# Copiar e configurar ambiente
cp .env.example .env

# Gerar chave
php artisan key:generate

# Executar migrations
php artisan migrate

# Iniciar servidor
php artisan serve
```

#### Frontend
```bash
cd frontend

# Instalar dependências
npm install

# Iniciar servidor
npm run dev
```

## Usuário de Teste

- Email: `laligesiane@gmail.com`
- Senha: `Password123!`

## Comandos Úteis

```bash
# Backend
docker compose -f docker-compose.simple.yml exec backend php artisan test
docker compose -f docker-compose.simple.yml exec backend php artisan migrate
docker compose -f docker-compose.simple.yml exec backend php artisan migrate:fresh --seed

# Frontend
cd frontend && npm run dev
cd frontend && npm run build
cd frontend && npm test
```

## Estrutura do Projeto

```
projeto-trello/
├── backend/                 # API Laravel
│   ├── app/
│   │   ├── Domain/        # Domínios (Boards, Cards, Lists, etc.)
│   │   │   └── {domain}/
│   │   │       ├── Http/Controllers/
│   │   │       └── Models/
│   │   ├── Http/Controllers/API/
│   │   ├── Models/
│   │   ├── Services/      # Lógica de negócio isolada
│   │   └── Notifications/
│   ├── database/migrations/
│   └── routes/api.php
├── frontend/               # Aplicação React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/        # Páginas (Login, Dashboard, Board)
│   │   ├── services/     # API calls
│   │   ├── store/        # Zustand stores
│   │   └── theme/        # Tema Ant Design
│   └── public/
└── docker-compose.simple.yml
```

## API Endpoints

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /api/auth/register | Registrar usuário |
| POST | /api/auth/login | Login |
| POST | /api/logout | Logout |
| POST | /api/auth/forgot-password | Solicitar recuperação de senha |
| POST | /api/auth/reset-password | Redefinir senha |

### Quadros
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/boards | Listar quadros |
| POST | /api/boards | Criar quadro |
| GET | /api/boards/{id} | Obter quadro |
| PUT | /api/boards/{id} | Atualizar quadro |
| DELETE | /api/boards/{id} | Excluir quadro |
| GET | /api/boards/archived | Listar arquivados |
| PUT | /api/boards/{id}/archive | Arquivar |
| PUT | /api/boards/{id}/restore | Restaurar |

### Listas
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/boards/{id}/lists | Listar listas |
| POST | /api/boards/{id}/lists | Criar lista |
| PUT | /api/lists/{id} | Atualizar lista |
| DELETE | /api/lists/{id} | Excluir lista |
| PUT | /api/lists/{id}/reorder | Reordenar |

### Cards
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/lists/{id}/cards | Listar cards |
| POST | /api/lists/{id}/cards | Criar card |
| PUT | /api/cards/{id} | Atualizar card |
| DELETE | /api/cards/{id} | Excluir card |
| PUT | /api/cards/{id}/reorder | Reordenar |
| PUT | /api/cards/{id}/move | Mover para outra lista |
| PUT | /api/cards/{id}/archive | Arquivar |
| PUT | /api/cards/{id}/restore | Restaurar |

### Membros
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/boards/{id}/members | Listar membros |
| POST | /api/boards/{id}/members | Adicionar membro |
| PUT | /api/boards/{id}/members/{mid}/role | Atualizar papel |
| DELETE | /api/boards/{id}/members/{mid} | Remover membro |

### Labels
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/boards/{id}/labels | Listar labels |
| POST | /api/boards/{id}/labels | Criar label |
| PUT | /api/labels/{id} | Atualizar label |
| DELETE | /api/labels/{id} | Excluir label |

### Checklist
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/cards/{id}/checklist | Listar itens |
| POST | /api/cards/{id}/checklist | Criar item |
| PUT | /api/checklist-items/{id} | Atualizar item |
| DELETE | /api/checklist-items/{id} | Excluir item |

### Comentários
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/cards/{id}/comments | Listar comentários |
| POST | /api/cards/{id}/comments | Criar comentário |
| PUT | /api/comments/{id} | Atualizar comentário |
| DELETE | /api/comments/{id} | Excluir comentário |

### Anexos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/cards/{id}/attachments | Listar anexos |
| POST | /api/cards/{id}/attachments | Upload de arquivo |
| GET | /api/attachments/{id}/download | Baixar arquivo |
| DELETE | /api/attachments/{id} | Excluir anexo |

## Design System

### Cores Principais
- Roxo (accent): `#7C6DD8`
- Fundo primário: `#FAFAFA`
- Fundo secundário: `#F4F5F7`

### Cores Pastéis para Boards
```javascript
['#A8D8EA', '#AA96DA', '#FCBAD3', '#FFFFD2', '#FFD3B6', '#FFAAA5', '#A8E6CF', '#C7CEEA']
```

### Tipografia
- Fonte: Nunito (Google Fonts)
- Hierarquia: títulos, subtítulos, texto secundário

### Componentes Reutilizáveis
- `BoardCard` - Card de preview do board
- `ListColumn` - Coluna de lista com cards
- `CardItem` - Card individual
- `CardModal` - Modal de criação/edição de card
- `MembersModal` - Gerenciamento de membros
- `LabelBadge` - Badge de label colorido

## Testes

O backend possui testes para:
- Autenticação (registro, login, logout)
- CRUD de boards
- Reordenação de cards e listas
- Filtros
- Regressão de ordenação

```bash
docker compose -f docker-compose.simple.yml exec backend php artisan test
```

## Convenções

### Idioma
- Todo texto de UI em **português (pt-BR)** com acentuação correta
- Commits conventional em pt-BR

### CSS
- Variáveis CSS definidas em `frontend/src/index.css`
- Tema Ant Design via `theme/boardyTheme.ts`
- Zero style inline

## Licença

MIT License
