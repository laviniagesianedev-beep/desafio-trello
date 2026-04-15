<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Board;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class BoardController extends Controller
{
    /**
     * Listar quadros do usuário
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            // Quadros que o usuário é dono
            $ownedBoards = Board::where('user_id', $user->id)
                ->whereNull('archived_at')
                ->with('members')
                ->withCount('lists', 'cards')
                ->orderBy('updated_at', 'desc')
                ->get();
            
            // Quadros que o usuário é membro (não dono)
            $memberBoards = $user->boards()
                ->whereNull('boards.archived_at')
                ->where('boards.user_id', '!=', $user->id)
                ->with('owner', 'members')
                ->withCount('lists', 'cards')
                ->orderBy('boards.updated_at', 'desc')
                ->get();
            
            return response()->json([
                'owned' => $ownedBoards,
                'member' => $memberBoards,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao buscar quadros',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Listar quadros compartilhados
     */
    public function shared(Request $request)
    {
        try {
            $boards = $request->user()->boards()
                ->whereNull('archived_at')
                ->with('owner', 'members')
                ->withCount('lists', 'cards')
                ->orderBy('updated_at', 'desc')
                ->get();
            
            return response()->json($boards);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao buscar quadros compartilhados',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Listar quadros arquivados
     */
    public function archived(Request $request)
    {
        try {
            $user = $request->user();
            
            // Quadros arquivados que o usuário é dono
            $ownedBoards = Board::where('user_id', $user->id)
                ->whereNotNull('archived_at')
                ->with('members')
                ->withCount('lists', 'cards')
                ->orderBy('archived_at', 'desc')
                ->get();
            
            // Quadros arquivados que o usuário é membro
            $memberBoards = $user->boards()
                ->whereNotNull('boards.archived_at')
                ->with('owner', 'members')
                ->withCount('lists', 'cards')
                ->orderBy('boards.archived_at', 'desc')
                ->get();
            
            return response()->json([
                'owned' => $ownedBoards,
                'member' => $memberBoards,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao buscar quadros arquivados',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Criar novo quadro
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string|max:1000',
                'background' => 'nullable|string|regex:/^#[0-9A-F]{6}$/i',
            ]);

            $board = Board::create([
                'user_id' => $request->user()->id,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'background' => $validated['background'] ?? '#A8D8EA',
            ]);

            // Adicionar o dono como membro admin
            $board->addMember($request->user()->id, 'admin');

            return response()->json($board->load('members'), 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Dados inválidos',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao criar quadro',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar quadro específico
     */
    public function show(Request $request, $id)
    {
        try {
            $board = Board::with(['lists.cards' => function ($query) {
                $query->whereNull('archived_at')
                      ->with(['labels', 'checklistItems'])
                      ->orderBy('position');
            }, 'members', 'owner', 'labels'])->findOrFail($id);

            // Verificar permissão
            $user = $request->user();
            if (!$board->hasMember($user->id) && $board->user_id !== $user->id) {
                return response()->json([
                    'message' => 'Você não tem permissão para acessar este quadro',
                ], 403);
            }

            return response()->json($board);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Quadro não encontrado',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Atualizar quadro
     */
    public function update(Request $request, $id)
    {
        try {
            $board = Board::findOrFail($id);
            $user = $request->user();

            // Verificar permissão (apenas dono ou admin/moderador)
            if ($board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator'])) {
                    return response()->json([
                        'message' => 'Você não tem permissão para editar este quadro',
                    ], 403);
                }
            }

            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string|max:1000',
                'background' => 'nullable|string|regex:/^#[0-9A-F]{6}$/i',
            ]);

            $board->update($validated);

            return response()->json($board);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Dados inválidos',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao atualizar quadro',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Arquivar quadro
     */
    public function archive(Request $request, $id)
    {
        try {
            $board = Board::findOrFail($id);
            $user = $request->user();

            // Verificar permissão (apenas dono ou admin/moderador)
            if ($board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator'])) {
                    return response()->json([
                        'message' => 'Você não tem permissão para arquivar este quadro',
                    ], 403);
                }
            }

            $board->archive();

            return response()->json([
                'message' => 'Quadro arquivado com sucesso',
                'board' => $board,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao arquivar quadro',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Restaurar quadro
     */
    public function restore(Request $request, $id)
    {
        try {
            $board = Board::findOrFail($id);
            $user = $request->user();

            // Verificar permissão (apenas dono ou admin/moderador)
            if ($board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator'])) {
                    return response()->json([
                        'message' => 'Você não tem permissão para restaurar este quadro',
                    ], 403);
                }
            }

            $board->restore();

            return response()->json([
                'message' => 'Quadro restaurado com sucesso',
                'board' => $board,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao restaurar quadro',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Excluir quadro
     */
    public function destroy(Request $request, $id)
    {
        try {
            $board = Board::findOrFail($id);
            $user = $request->user();

            // Verificar permissão (apenas dono)
            if ($board->user_id !== $user->id) {
                return response()->json([
                    'message' => 'Apenas o dono pode excluir o quadro',
                ], 403);
            }

            $board->delete();

            return response()->json([
                'message' => 'Quadro excluído com sucesso',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao excluir quadro',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}