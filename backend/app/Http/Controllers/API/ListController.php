<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\ListModel;
use App\Services\ReorderService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ListController extends Controller
{
    private ReorderService $reorderService;

    public function __construct(ReorderService $reorderService)
    {
        $this->reorderService = $reorderService;
    }
    /**
     * Listar listas de um quadro
     */
    public function index(Request $request, $boardId)
    {
        try {
            $board = Board::findOrFail($boardId);
            $user = $request->user();

            // Verificar permissão
            if (!$board->hasMember($user->id) && $board->user_id !== $user->id) {
                return response()->json([
                    'message' => 'Você não tem permissão para acessar este quadro',
                ], 403);
            }

            $lists = $board->lists()
                ->with(['cards' => function ($query) {
                    $query->whereNull('archived_at')
                          ->orderBy('position');
                }])
                ->orderBy('position')
                ->get();

            return response()->json($lists);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao buscar listas',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Criar nova lista
     */
    public function store(Request $request, $boardId)
    {
        try {
            $board = Board::findOrFail($boardId);
            $user = $request->user();

            // Verificar permissão (apenas admin, moderador ou normal)
            if ($board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator', 'normal'])) {
                    return response()->json([
                        'message' => 'Você não tem permissão para criar listas neste quadro',
                    ], 403);
                }
            }

            $validated = $request->validate([
                'title' => 'required|string|max:255',
            ]);

            $list = new ListModel();
            $list->board_id = $boardId;
            $list->title = $validated['title'];
            $list->position = $list->getNextPosition();
            $list->save();

            return response()->json($list, 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Dados inválidos',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao criar lista',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar lista específica
     */
    public function show(Request $request, $id)
    {
        try {
            $list = ListModel::with(['cards' => function ($query) {
                $query->whereNull('archived_at')
                      ->orderBy('position');
            }])->findOrFail($id);

            $user = $request->user();
            $board = $list->board;

            // Verificar permissão
            if (!$board->hasMember($user->id) && $board->user_id !== $user->id) {
                return response()->json([
                    'message' => 'Você não tem permissão para acessar esta lista',
                ], 403);
            }

            return response()->json($list);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Lista não encontrada',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Atualizar lista
     */
    public function update(Request $request, $id)
    {
        try {
            $list = ListModel::findOrFail($id);
            $user = $request->user();
            $board = $list->board;

            // Verificar permissão (apenas admin, moderador ou normal)
            if ($board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator', 'normal'])) {
                    return response()->json([
                        'message' => 'Você não tem permissão para editar listas neste quadro',
                    ], 403);
                }
            }

            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
            ]);

            $list->update($validated);

            return response()->json($list);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Dados inválidos',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao atualizar lista',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reordenar lista
     */
    public function reorder(Request $request, $id)
    {
        try {
            $list = ListModel::findOrFail($id);
            $user = $request->user();
            $board = $list->board;

            if ($board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator', 'normal'])) {
                    return response()->json([
                        'message' => 'Você não tem permissão para reordenar listas neste quadro',
                    ], 403);
                }
            }

            $validated = $request->validate([
                'position' => 'required|integer|min:1',
            ]);

            $list = $this->reorderService->reorderList($id, $validated['position']);

            return response()->json($list);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Dados inválidos',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao reordenar lista',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Excluir lista (com opção de mover cards)
     */
    public function destroy(Request $request, $id)
    {
        try {
            $list = ListModel::findOrFail($id);
            $user = $request->user();
            $board = $list->board;

            if ($board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator'])) {
                    return response()->json([
                        'message' => 'Você não tem permissão para excluir listas neste quadro',
                    ], 403);
                }
            }

            $validated = $request->validate([
                'move_to_list_id' => 'sometimes|integer|exists:lists,id',
            ]);

            $moveToListId = $validated['move_to_list_id'] ?? null;

            if ($moveToListId) {
                $moveToList = ListModel::findOrFail($moveToListId);
                if ($moveToList->board_id !== $board->id) {
                    return response()->json([
                        'message' => 'A lista destino pertence a outro quadro',
                    ], 400);
                }

                $list->cards->each(function ($card) use ($moveToListId) {
                    $card->list_id = $moveToListId;
                    $card->position = $card->getNextPosition();
                    $card->save();
                });

                $moveToList->load('cards');
                $moveToList->reorganizeCards();
            }

            $list->delete();

            return response()->json([
                'message' => $moveToListId ? 'Lista excluída e cards movidos com sucesso' : 'Lista excluída com sucesso',
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Dados inválidos',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao excluir lista',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}