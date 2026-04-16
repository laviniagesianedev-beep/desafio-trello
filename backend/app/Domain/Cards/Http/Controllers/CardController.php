<?php

namespace App\Domain\Cards\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Domain\Cards\Models\Card;
use App\Domain\Lists\Models\ListModel;
use App\Services\ReorderService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CardController extends Controller
{
    private ReorderService $reorderService;

    public function __construct(ReorderService $reorderService)
    {
        $this->reorderService = $reorderService;
    }
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
                ->with(['creator', 'assignedMembers', 'comments', 'attachments', 'labels', 'checklistItems'])
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
                'due_date' => 'nullable|date',
                'label_ids' => 'nullable|array',
                'label_ids.*' => 'exists:labels,id',
            ]);

            $card = new Card();
            $card->list_id = $listId;
            $card->user_id = $user->id;
            $card->title = $validated['title'];
            $card->description = $validated['description'] ?? null;
            $card->due_date = $validated['due_date'] ?? null;
            $card->position = $card->getNextPosition();
            $card->save();

            if (!empty($validated['label_ids'])) {
                $card->labels()->attach($validated['label_ids']);
            }

            return response()->json($card->load(['creator', 'labels', 'checklistItems']), 201);

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
            $card = Card::with(['creator', 'assignedMembers', 'comments.author', 'attachments.uploader', 'labels', 'checklistItems'])
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
                'due_date' => 'nullable|date',
                'label_ids' => 'nullable|array',
                'label_ids.*' => 'exists:labels,id',
            ]);

            $card->update(array_filter([
                'title' => $validated['title'] ?? null,
                'description' => $validated['description'] ?? null,
                'due_date' => $validated['due_date'] ?? null,
            ], fn($v) => $v !== null));

            if (array_key_exists('label_ids', $validated)) {
                $card->labels()->sync($validated['label_ids'] ?? []);
            }

            return response()->json($card->load(['creator', 'labels', 'checklistItems']));

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

            $card = $this->reorderService->reorderCard($id, $validated['position']);

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

            $targetList = ListModel::findOrFail($validated['list_id']);
            if ($targetList->board_id !== $board->id) {
                return response()->json([
                    'message' => 'A lista destino pertence a outro quadro',
                ], 400);
            }

            $card = $this->reorderService->moveCard($id, $validated['list_id'], $validated['position']);

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