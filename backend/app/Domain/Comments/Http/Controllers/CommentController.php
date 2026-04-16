<?php

namespace App\Domain\Comments\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Domain\Cards\Models\Card;
use App\Domain\Comments\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CommentController extends Controller
{
    /**
     * Listar comentários de um card
     */
    public function index(Request $request, $cardId)
    {
        try {
            $card = Card::findOrFail($cardId);
            $user = $request->user();
            $board = $card->list->board;

            // Verificar permissão
            if (!$board->hasMember($user->id) && $board->user_id !== $user->id) {
                return response()->json([
                    'message' => 'Você não tem permissão para acessar este card',
                ], 403);
            }

            $comments = $card->comments()
                ->with('author')
                ->orderBy('created_at', 'desc')
                ->get();

            $result = $comments->map(function ($comment) use ($user, $board) {
                $canEdit = $comment->user_id === $user->id;
                
                return [
                    'id' => $comment->id,
                    'content' => $comment->content,
                    'card_id' => $comment->card_id,
                    'author_id' => $comment->user_id,
                    'author_name' => $comment->author->name ?? 'Usuário',
                    'created_at' => $comment->created_at,
                    'updated_at' => $comment->updated_at,
                    'can_edit' => $canEdit,
                ];
            });

            return response()->json($result);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao buscar comentários',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Criar novo comentário
     */
    public function store(Request $request, $cardId)
    {
        try {
            $card = Card::findOrFail($cardId);
            $user = $request->user();
            $board = $card->list->board;

            // Verificar permissão (apenas observador não pode comentar)
            if ($board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if ($role === 'observer') {
                    return response()->json([
                        'message' => 'Você não tem permissão para comentar neste quadro',
                    ], 403);
                }
            }

            $validated = $request->validate([
                'content' => 'required|string|max:2000',
            ]);

            $comment = new Comment();
            $comment->card_id = $cardId;
            $comment->user_id = $user->id;
            $comment->content = $validated['content'];
            $comment->save();

            return response()->json([
                'id' => $comment->id,
                'content' => $comment->content,
                'card_id' => $comment->card_id,
                'author_id' => $comment->user_id,
                'author_name' => $user->name,
                'created_at' => $comment->created_at,
                'updated_at' => $comment->updated_at,
                'can_edit' => true,
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Dados inválidos',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao criar comentário',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Atualizar comentário
     */
    public function update(Request $request, $id)
    {
        try {
            $comment = Comment::findOrFail($id);
            $user = $request->user();

            // Verificar se é o autor do comentário
            if ($comment->user_id !== $user->id) {
                return response()->json([
                    'message' => 'Você só pode editar seus próprios comentários',
                ], 403);
            }

            $validated = $request->validate([
                'content' => 'required|string|max:2000',
            ]);

            $comment->update($validated);

            return response()->json([
                'id' => $comment->id,
                'content' => $comment->content,
                'card_id' => $comment->card_id,
                'author_id' => $comment->user_id,
                'author_name' => $comment->author->name ?? 'Usuário',
                'created_at' => $comment->created_at,
                'updated_at' => $comment->updated_at,
                'can_edit' => true,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Dados inválidos',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao atualizar comentário',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Excluir comentário
     */
    public function destroy(Request $request, $id)
    {
        try {
            $comment = Comment::findOrFail($id);
            $user = $request->user();
            $board = $comment->card->list->board;

            // Verificar permissão (autor, dono do quadro ou admin/moderador)
            if ($comment->user_id !== $user->id && $board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator'])) {
                    return response()->json([
                        'message' => 'Você não tem permissão para excluir este comentário',
                    ], 403);
                }
            }

            $comment->delete();

            return response()->json([
                'message' => 'Comentário excluído com sucesso',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao excluir comentário',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}