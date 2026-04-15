# Boardy - Trello Clone

Uma aplicação completa de gerenciamento de quadros Kanban, inspirada no Trello, com design elegante e cores pastéis.

## Tecnologias

### Backend
- **Laravel 10** - Framework PHP
- **SQLite** - Banco de dados
- **Laravel Sanctum** - Autenticação via API tokens
- **Redis** - Cache e fila

### Frontend
- **React 18** - Biblioteca de interface
- **TypeScript** - Tipagem estática
- **Ant Design** - Biblioteca de componentes
- **Zustand** - Gerenciamento de estado
- **React Router** - Roteamento
- **Axios** - Cliente HTTP

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração de containers
- **Nginx** - Servidor web

## Funcionalidades

### Autenticação
- Registro com validação de senha forte
- Login com email/senha
- Recuperação de senha via email
- Tokens de API com Sanctum

### Quadros
- Criar, editar, excluir quadros
- Cores pastéis personalizáveis
- Arquivar e restaurar quadros
- Compartilhamento com membros

### Listas
- Criar, editar, excluir listas
- Reordenar listas via drag & drop
- Posicionamento automático

### Cards
- Criar, editar, excluir cards
- Mover cards entre listas
- Descrição e data de entrega
- Arquivar e restaurar cards

### Colaboração
- Sistema de permissões (Admin, Moderador, Normal, Observador)
- Convites por email
- Comentários em cards
- Anexos de arquivos

### Interface
- Design elegante com cores pastéis
- Tema personalizado no Ant Design
- Layout responsivo
- Animações suaves

## Configuração

### Pré-requisitos
- Docker e Docker Compose (recomendado)
- Node.js 20+
- PHP 8.2+
- Composer

### Instalação com Docker (Recomendado)

1. Clone o repositório:
```bash
git clone <repository-url>
cd projeto-trello
```

2. Inicie os containers:
```bash
docker-compose up -d
```

3. Instale as dependências do backend:
```bash
docker-compose exec backend composer install
```

4. Execute as migrations:
```bash
docker-compose exec backend php artisan migrate
```

5. Crie o link de storage:
```bash
docker-compose exec backend php artisan storage:link
```

6. Instale as dependências do frontend:
```bash
docker-compose exec frontend npm install
```

7. Acesse a aplicação:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api

### Instalação Local (Sem Docker)

#### Backend
```bash
cd backend

# Instalar dependências
composer install

# Copiar arquivo de ambiente
cp .env.example .env

# Gerar chave da aplicação
php artisan key:generate

# Criar banco de dados SQLite
touch database/database.sqlite

# Executar migrations
php artisan migrate

# Criar link de storage
php artisan storage:link

# Iniciar servidor
php artisan serve
```

#### Frontend
```bash
cd frontend

# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Iniciar servidor de desenvolvimento
npm run dev
```

### Usuário de Teste
- Email: `lavinia.gesiane.dev@b2pro.com.br`
- Senha: `Password123!`

## Estrutura do Projeto

```
projeto-trello/
├── backend/           # API Laravel
│   ├── app/
│   │   ├── Http/Controllers/API/
│   │   ├── Models/
│   │   └── Providers/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/
│   └── storage/
├── frontend/          # Aplicação React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── services/
│   │   └── theme/
│   └── public/
├── docker/            # Configurações Docker
└── docker-compose.yml
```

## API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Esqueci minha senha
- `POST /api/auth/reset-password` - Redefinir senha

### Quadros
- `GET /api/boards` - Listar quadros
- `POST /api/boards` - Criar quadro
- `GET /api/boards/{id}` - Obter quadro
- `PUT /api/boards/{id}` - Atualizar quadro
- `DELETE /api/boards/{id}` - Excluir quadro

### Listas
- `GET /api/boards/{boardId}/lists` - Listar listas
- `POST /api/boards/{boardId}/lists` - Criar lista
- `PUT /api/lists/{id}` - Atualizar lista
- `DELETE /api/lists/{id}` - Excluir lista

### Cards
- `GET /api/lists/{listId}/cards` - Listar cards
- `POST /api/lists/{listId}/cards` - Criar card
- `PUT /api/cards/{id}` - Atualizar card
- `PUT /api/cards/{id}/move` - Mover card
- `DELETE /api/cards/{id}` - Excluir card

### Membros
- `GET /api/boards/{boardId}/members` - Listar membros
- `POST /api/boards/{boardId}/members` - Adicionar membro
- `PUT /api/boards/{boardId}/members/{memberId}/role` - Atualizar papel
- `DELETE /api/boards/{boardId}/members/{memberId}` - Remover membro

## Desenvolvimento

### Backend
```bash
# Entrar no container
docker-compose exec backend bash

# Executar testes
php artisan test

# Gerar chave API
php artisan key:generate

# Limpar cache
php artisan cache:clear
php artisan config:clear
```

### Frontend
```bash
# Entrar no container
docker-compose exec frontend bash

# Executar testes
npm test

# Build de produção
npm run build
```

## Design System

### Cores Pastéis
- Azul: `#A8D8EA`
- Verde: `#AA96DA`
- Rosa: `#FCBAD3`
- Amarelo: `#FFFFD2`
- Laranja: `#FFD3B6`
- Vermelho: `#FFAAA5`
- Verde-água: `#A8E6CF`

### Tipografia
- Fonte: Inter
- Tamanhos: 12px, 14px, 16px, 18px, 20px, 24px, 32px

### Bordas Arredondadas
- Small: 8px
- Medium: 12px
- Large: 16px
- Extra Large: 20px

## Licença

MIT License