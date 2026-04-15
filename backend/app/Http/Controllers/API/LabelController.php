<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\Label;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class LabelController extends Controller
{
    public function index(Request $request, $boardId)
    {
        try {
            $board = Board::findOrFail($boardId);
            $user = $request->user();

            if (!$board->hasMember($user->id) && $board->user_id !== $user->id) {
                return response()->json(['message' => 'Sem permissão'], 403);
            }

            $labels = $board->labels()->orderBy('name')->get();

            return response()->json($labels);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erro ao buscar labels', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request, $boardId)
    {
        try {
            $board = Board::findOrFail($boardId);
            $user = $request->user();

            if ($board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator', 'normal'])) {
                    return response()->json(['message' => 'Sem permissão'], 403);
                }
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'color' => 'required|string|size:7|regex:/^#[0-9A-Fa-f]{6}$/',
            ]);

            $label = $board->labels()->create([
                'name' => $validated['name'],
                'color' => $validated['color'],
            ]);

            return response()->json($label, 201);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Dados inválidos', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erro ao criar label', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $label = Label::findOrFail($id);
            $user = $request->user();
            $board = $label->board;

            if ($board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator', 'normal'])) {
                    return response()->json(['message' => 'Sem permissão'], 403);
                }
            }

            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'color' => 'sometimes|required|string|size:7|regex:/^#[0-9A-Fa-f]{6}$/',
            ]);

            $label->update($validated);

            return response()->json($label);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Dados inválidos', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erro ao atualizar label', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $label = Label::findOrFail($id);
            $user = $request->user();
            $board = $label->board;

            if ($board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator'])) {
                    return response()->json(['message' => 'Sem permissão'], 403);
                }
            }

            $label->delete();

            return response()->json(['message' => 'Label excluído com sucesso']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erro ao excluir label', 'error' => $e->getMessage()], 500);
        }
    }
}
