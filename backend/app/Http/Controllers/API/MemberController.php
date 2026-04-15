<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MemberController extends Controller
{
    /**
     * Listar membros de um quadro
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

            // Incluir dono como membro admin
            $owner = $board->owner;
            $owner->pivot = (object) ['role' => 'admin'];
            
            $members = $board->members;
            $members->prepend($owner);

            return response()->json($members);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao buscar membros',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Adicionar membro ao quadro
     */
    public function store(Request $request, $boardId)
    {
        try {
            $board = Board::findOrFail($boardId);
            $user = $request->user();

            // Verificar permissão (apenas admin ou moderador)
            if ($board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator'])) {
                    return response()->json([
                        'message' => 'Você não tem permissão para adicionar membros neste quadro',
                    ], 403);
                }
            }

            $validated = $request->validate([
                'email' => 'required|email|exists:users,email',
                'role' => 'nullable|in:admin,moderator,normal,observer',
            ]);

            // Encontrar usuário pelo email
            $memberUser = User::where('email', $validated['email'])->first();

            // Verificar se já é membro
            if ($board->hasMember($memberUser->id)) {
                return response()->json([
                    'message' => 'Usuário já é membro deste quadro',
                ], 400);
            }

            // Adicionar membro
            $board->addMember($memberUser->id, $validated['role'] ?? 'normal');

            return response()->json([
                'message' => 'Membro adicionado com sucesso',
                'member' => $memberUser,
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Dados inválidos',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao adicionar membro',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Atualizar papel de membro
     */
    public function updateRole(Request $request, $boardId, $memberId)
    {
        try {
            $board = Board::findOrFail($boardId);
            $user = $request->user();

            // Verificar permissão (apenas dono ou admin)
            if ($board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if ($role !== 'admin') {
                    return response()->json([
                        'message' => 'Você não tem permissão para alterar papéis neste quadro',
                    ], 403);
                }
            }

            $validated = $request->validate([
                'role' => 'required|in:admin,moderator,normal,observer',
            ]);

            // Não permitir alterar o próprio papel se for o único admin
            if ($memberId == $user->id) {
                $adminCount = $board->members()
                    ->wherePivot('role', 'admin')
                    ->count();
                
                if ($adminCount <= 1 && $validated['role'] !== 'admin') {
                    return response()->json([
                        'message' => 'Não é possível remover o papel de admin do único admin',
                    ], 400);
                }
            }

            $board->updateMemberRole($memberId, $validated['role']);

            return response()->json([
                'message' => 'Papel atualizado com sucesso',
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Dados inválidos',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao atualizar papel',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remover membro do quadro
     */
    public function destroy(Request $request, $boardId, $memberId)
    {
        try {
            $board = Board::findOrFail($boardId);
            $user = $request->user();

            // Verificar permissão
            // Usuário pode sair do quadro
            if ($memberId == $user->id) {
                // Dono não pode sair do próprio quadro
                if ($board->user_id == $user->id) {
                    return response()->json([
                        'message' => 'O dono não pode sair do quadro. Transfira a propriedade primeiro.',
                    ], 400);
                }
            } else {
                // Remover outro membro: apenas admin ou moderador
                if ($board->user_id !== $user->id) {
                    $role = $board->getMemberRole($user->id);
                    if (!in_array($role, ['admin', 'moderator'])) {
                        return response()->json([
                            'message' => 'Você não tem permissão para remover membros deste quadro',
                        ], 403);
                    }
                }
            }

            // Não permitir remover o único admin
            if ($memberId == $user->id) {
                $adminCount = $board->members()
                    ->wherePivot('role', 'admin')
                    ->count();
                
                if ($adminCount <= 1) {
                    return response()->json([
                        'message' => 'Não é possível remover o único admin. Promova outro membro primeiro.',
                    ], 400);
                }
            }

            $board->removeMember($memberId);

            return response()->json([
                'message' => 'Membro removido com sucesso',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao remover membro',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}