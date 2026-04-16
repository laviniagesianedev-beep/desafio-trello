# Design: Editor Rich Text + Comentários com Autor e Edição

## Problema
Usuários precisam de formatação rica na descrição dos cards e nos comentários. Também precisam ver quem fez cada comentário e poder editar seus próprios comentários.

## Decisões

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| Biblioteca de editor | TipTap | Headless, flexível, React-friendly, moderna |
| Formatação | Bold, italic, links, código inline, listas | Cobertura completa sem exageros |
| Escopo da edição | Próprio comentário apenas | Não permite editar comentários de outros |
| Permissão para comentar | Admin, Moderador, Normal | Observador não pode comentar |

## Arquitetura

### Backend

**Modelo Comment:**
```php
// já existe - adicionar scopes de permissão
- author_id (fk users)
- content (text) - formato JSON (TipTap usa HTML internamente)
- created_at, updated_at
```

**API Changes:**

| Método | Endpoint | Mudança |
|--------|----------|---------|
| GET | /api/cards/{id}/comments | Adicionar `author_name` ao response |
| POST | /api/cards/{id}/comments | Manter igual |
| PUT | /api/comments/{id} | **NOVO** - editar conteúdo |
| DELETE | /api/comments/{id} | Manter igual |

**Response GET comments:**
```json
{
  "id": 1,
  "content": "<p>Texto <strong>formatado</strong></p>",
  "author_id": 5,
  "author_name": "João Silva",
  "card_id": 10,
  "created_at": "2026-04-16T10:00:00Z",
  "updated_at": "2026-04-16T10:00:00Z",
  "can_edit": true
}
```

**Regras de permissão:**
- Admin, Moderador, Normal: podem comentar e editar APENAS seus próprios comentários
- Observador: não pode comentar, ver apenas
- Owner do card: pode editar qualquer comentário do board

### Frontend

**Dependência:** `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`

**Componentes novos:**
- `RichTextEditor.tsx` - wrapper TipTap com toolbar
- Atualizar `CardModal.tsx` - integrar editor na descrição
- Atualizar `CommentsSection.tsx` (ou criar) - editor + lista de comentários

**RichTextEditor:**
```
Toolbar: [B] [I] [Link] [Code] [Lista] [Lista numerada]
Área de edição com placeholder
```

**Lista de comentários:**
```
[Avatar] Nome do Autor - há 2 horas
         Conteúdo formatado
         [Editar] (se for o autor ou admin)
```

## Interface

### CardModal - Descrição
```
┌─────────────────────────────────────────┐
│ Descrição                              │
│ ┌─────────────────────────────────────┐ │
│ │ [B] [I] [Link] [Code] [•] [1.]    │ │
│ ├─────────────────────────────────────┤ │
│ │ Digite uma descrição...            │ │
│ │                                     │ │
│ │ Texto com **formatação**           │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Seção de Comentários
```
┌─────────────────────────────────────────┐
│ Comentários                            │
│ ┌─────────────────────────────────────┐ │
│ │ [B] [I] [Link] [Code] [•] [1.]    │ │
│ ├─────────────────────────────────────┤ │
│ │ Adicionar comentário...            │ │
│ └─────────────────────────────────────┘ │
│                    [Comentar]          │
├─────────────────────────────────────────┤
│ [Avatar] Maria Silva - há 1 hora       │
│           <p>Texto <strong>negrito</strong></p>
│           [Editar]                     │
├─────────────────────────────────────────┤
│ [Avatar] João Santos - há 3 horas      │
│           Comentário simples           │
│           (sem botão editar)           │
└─────────────────────────────────────────┘
```

### Modal de Edição de Comentário
```
┌─────────────────────────────────────────┐
│ Editar Comentário                      │
│ ┌─────────────────────────────────────┐ │
│ │ [B] [I] [Link] [Code] [•] [1.]    │ │
│ ├─────────────────────────────────────┤ │
│ │ Conteúdo atual para edição         │ │
│ └─────────────────────────────────────┘ │
│                          [Cancelar]    │
│                          [Salvar]      │
└─────────────────────────────────────────┘
```

## Comportamento

### Criar comentário
1. Usuário digita no editor rich text
2. Clica em "Comentar"
3. Loading state no botão
4. POST para API
5. Comentário aparece na lista com author_name
6. Editor limpa

### Editar comentário
1. Usuário clica em "Editar"
2. Abre modal com editor pré-preenchido
3. Usuário modifica e salva
4. PUT para API
5. Comentário atualiza com `updated_at`

### Permissão negada
- Observador não vê campo de comentário
- Botão "Editar" hidden para não-autores (exceto Admin)

## Fora do Escopo
- Menções (@usuario) nos comentários
- Notificações de novos comentários
- Comentários em tempo real (WebSocket)
- Historial de edição de comentários

## Verificação
- [ ] Backend retorna `author_name` nos comentários
- [ ] PUT /api/comments/{id} funciona
- [ ] Permissão: observador não vê campo de comentário
- [ ] Permissão: usuário só edita próprio comentário
- [ ] Editor TipTap funciona na descrição do card
- [ ] Editor TipTap funciona nos comentários
- [ ] Formatação (bold, italic, links) persiste após salvar
- [ ] Responsivo em mobile
