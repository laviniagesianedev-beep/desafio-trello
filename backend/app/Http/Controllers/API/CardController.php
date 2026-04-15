<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Card;
use App\Models\ListModel;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CardController extends Controller
{
    /**
     * Listar cards de uma lista
     */
    public function index(Request $request, $listId)
    {
        try {
            $list = ListModel::findOrFail($listId);
            $user = $request->user();
            $board = $list->board;

            // Verificar permissão
            if (!$board->hasMember($user->id) && $board->user_id !== $user->id) {
                return response()->json([
                    'message' => 'Você não tem permissão para acessar esta lista',
                ], 403);
            }

            $cards = $list->cards()
                ->whereNull('archived_at')
                ->with(['creator', 'assignedMembers', 'comments', 'attachments'])
                ->orderBy('position')
                ->get();

            return response()->json($cards);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao buscar cards',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Criar novo card
     */
    public function store(Request $request, $listId)
    {
        try {
            $list = ListModel::findOrFail($listId);
            $user = $request->user();
            $board = $list->board;

            // Verificar permissão (apenas admin, moderador ou normal)
            if ($board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator', 'normal'])) {
                    return response()->json([
                        'message' => 'Você não tem permissão para criar cards nesta lista',
                    ], 403);
                }
            }

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string|max:2000',
                'due_date' => 'nullable|date|after:today',
            ]);

            $card = new Card();
            $card->list_id = $listId;
            $card->user_id = $user->id;
            $card->title = $validated['title'];
            $card->description = $validated['description'] ?? null;
            $card->due_date = $validated['due_date'] ?? null;
            $card->position = $card->getNextPosition();
            $card->save();

            return response()->json($card->load('creator'), 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Dados inválidos',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao criar card',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar card específico
     */
    public function show(Request $request, $id)
    {
        try {
            $card = Card::with(['creator', 'assignedMembers', 'comments.author', 'attachments.uploader'])
                ->findOrFail($id);

            $user = $request->user();
            $board = $card->list->board;

            // Verificar permissão
            if (!$board->hasMember($user->id) && $board->user_id !== $user->id) {
                return response()->json([
                    'message' => 'Você não tem permissão para acessar este card',
                ], 403);
            }

            return response()->json($card);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Card não encontrado',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Atualizar card
     */
    public function update(Request $request, $id)
    {
        try {
            $card = Card::findOrFail($id);
            $user = $request->user();
            $board = $card->list->board;

            // Verificar permissão (apenas admin, moderador, normal ou criador)
            if ($board->user_id !== $user->id && $card->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator', 'normal'])) {
                    return response()->json([
                        'message' => 'Você não tem permissão para editar este card',
                    ], 403);
                }
            }

            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string|max:2000',
                'due_date' => 'nullable|date|after:today',
            ]);

            $card->update($validated);

            return response()->json($card);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Dados inválidos',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao atualizar card',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reordenar card na mesma lista
     */
    public function reorder(Request $request, $id)
    {
        try {
            $card = Card::findOrFail($id);
            $user = $request->user();
            $board = $card->list->board;

            // Verificar permissão (apenas admin, moderador ou normal)
            if ($board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator', 'normal'])) {
                    return response()->json([
                        'message' => 'Você não tem permissão para reordenar cards neste quadro',
                    ], 403);
                }
            }

            $validated = $request->validate([
                'position' => 'required|integer|min:1',
            ]);

            // Reordenar cards na lista
            $cards = $card->list->cards()
                ->where('id', '!=', $card->id)
                ->orderBy('position')
                ->get();

            $position = 1;
            foreach ($cards as $c) {
                if ($position == $validated['position']) {
                    $position++;
                }
                $c->position = $position;
                $c->save();
                $position++;
            }

            $card->position = $validated['position'];
            $card->save();

            return response()->json($card);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Dados inválidos',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao reordenar card',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mover card para outra lista
     */
    public function move(Request $request, $id)
    {
        try {
            $card = Card::findOrFail($id);
            $user = $request->user();
            $board = $card->list->board;

            // Verificar permissão (apenas admin, moderador ou normal)
            if ($board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator', 'normal'])) {
                    return response()->json([
                        'message' => 'Você não tem permissão para mover cards neste quadro',
                    ], 403);
                }
            }

            $validated = $request->validate([
                'list_id' => 'required|exists:lists,id',
                'position' => 'required|integer|min:1',
            ]);

            // Verificar se a lista pertence ao mesmo quadro
            $targetList = ListModel::findOrFail($validated['list_id']);
            if ($targetList->board_id !== $board->id) {
                return response()->json([
                    'message' => 'A lista destino pertence a outro quadro',
                ], 400);
            }

            $card->moveTo($validated['list_id'], $validated['position']);

            return response()->json($card);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Dados inválidos',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao mover card',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Arquivar card
     */
    public function archive(Request $request, $id)
    {
        try {
            $card = Card::findOrFail($id);
            $user = $request->user();
            $board = $card->list->board;

            // Verificar permissão (apenas admin, moderador, normal ou criador)
            if ($board->user_id !== $user->id && $card->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator', 'normal'])) {
                    return response()->json([
                        'message' => 'Você não tem permissão para arquivar este card',
                    ], 403);
                }
            }

            $card->archive();

            return response()->json([
                'message' => 'Card arquivado com sucesso',
                'card' => $card,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao arquivar card',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Restaurar card
     */
    public function restore(Request $request, $id)
    {
        try {
            $card = Card::findOrFail($id);
            $user = $request->user();
            $board = $card->list->board;

            // Verificar permissão (apenas admin, moderador ou dono)
            if ($board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator'])) {
                    return response()->json([
                        'message' => 'Você não tem permissão para restaurar este card',
                    ], 403);
                }
            }

            $card->restore();

            return response()->json([
                'message' => 'Card restaurado com sucesso',
                'card' => $card,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao restaurar card',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Excluir card
     */
    public function destroy(Request $request, $id)
    {
        try {
            $card = Card::findOrFail($id);
            $user = $request->user();
            $board = $card->list->board;

            // Verificar permissão (apenas dono, admin ou criador)
            if ($board->user_id !== $user->id && $card->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin'])) {
                    return response()->json([
                        'message' => 'Você não tem permissão para excluir este card',
                    ], 403);
                }
            }

            $card->delete();

            return response()->json([
                'message' => 'Card excluído com sucesso',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao excluir card',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}