<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Card;
use App\Models\ChecklistItem;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ChecklistItemController extends Controller
{
    public function index(Request $request, $cardId)
    {
        try {
            $card = Card::findOrFail($cardId);
            $user = $request->user();
            $board = $card->list->board;

            if (!$board->hasMember($user->id) && $board->user_id !== $user->id) {
                return response()->json(['message' => 'Sem permissão'], 403);
            }

            $items = $card->checklistItems()->orderBy('position')->get();

            return response()->json($items);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erro ao buscar checklist', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request, $cardId)
    {
        try {
            $card = Card::findOrFail($cardId);
            $user = $request->user();
            $board = $card->list->board;

            if ($board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator', 'normal'])) {
                    return response()->json(['message' => 'Sem permissão'], 403);
                }
            }

            $validated = $request->validate([
                'content' => 'required|string|max:1000',
            ]);

            $maxPosition = $card->checklistItems()->max('position') ?? 0;

            $item = $card->checklistItems()->create([
                'content' => $validated['content'],
                'position' => $maxPosition + 1,
            ]);

            return response()->json($item, 201);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Dados inválidos', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erro ao criar item', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $item = ChecklistItem::findOrFail($id);
            $user = $request->user();
            $board = $item->card->list->board;

            if ($board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator', 'normal'])) {
                    return response()->json(['message' => 'Sem permissão'], 403);
                }
            }

            $validated = $request->validate([
                'content' => 'sometimes|required|string|max:1000',
                'is_checked' => 'sometimes|boolean',
                'position' => 'sometimes|integer|min:1',
            ]);

            $item->update($validated);

            return response()->json($item);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Dados inválidos', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erro ao atualizar item', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $item = ChecklistItem::findOrFail($id);
            $user = $request->user();
            $board = $item->card->list->board;

            if ($board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator', 'normal'])) {
                    return response()->json(['message' => 'Sem permissão'], 403);
                }
            }

            $item->delete();

            return response()->json(['message' => 'Item excluído com sucesso']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erro ao excluir item', 'error' => $e->getMessage()], 500);
        }
    }
}
