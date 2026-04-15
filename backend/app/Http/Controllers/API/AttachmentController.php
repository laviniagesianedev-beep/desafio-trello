<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Attachment;
use App\Models\Card;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AttachmentController extends Controller
{
    /**
     * Listar anexos de um card
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

            $attachments = $card->attachments()
                ->with('uploader')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($attachments);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao buscar anexos',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Fazer upload de anexo
     */
    public function store(Request $request, $cardId)
    {
        try {
            $card = Card::findOrFail($cardId);
            $user = $request->user();
            $board = $card->list->board;

            // Verificar permissão (apenas observador não pode anexar)
            if ($board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if ($role === 'observer') {
                    return response()->json([
                        'message' => 'Você não tem permissão para anexar arquivos neste quadro',
                    ], 403);
                }
            }

            $request->validate([
                'file' => 'required|file|max:10240', // 10MB
            ]);

            $file = $request->file('file');
            
            // Validar tipo de arquivo
            $allowedTypes = [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain',
                'text/csv',
            ];

            if (!in_array($file->getMimeType(), $allowedTypes)) {
                return response()->json([
                    'message' => 'Tipo de arquivo não permitido',
                ], 422);
            }

            // Salvar arquivo
            $path = $file->store('attachments', 'public');

            $attachment = new Attachment();
            $attachment->card_id = $cardId;
            $attachment->user_id = $user->id;
            $attachment->file_path = $path;
            $attachment->file_name = $file->getClientOriginalName();
            $attachment->file_size = $file->getSize();
            $attachment->file_type = $file->getMimeType();
            $attachment->save();

            return response()->json($attachment->load('uploader'), 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Dados inválidos',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao fazer upload do arquivo',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Baixar anexo
     */
    public function download(Request $request, $id)
    {
        try {
            $attachment = Attachment::findOrFail($id);
            $user = $request->user();
            $board = $attachment->card->list->board;

            // Verificar permissão
            if (!$board->hasMember($user->id) && $board->user_id !== $user->id) {
                return response()->json([
                    'message' => 'Você não tem permissão para acessar este anexo',
                ], 403);
            }

            if (!Storage::disk('public')->exists($attachment->file_path)) {
                return response()->json([
                    'message' => 'Arquivo não encontrado',
                ], 404);
            }

            return Storage::disk('public')->download($attachment->file_path, $attachment->file_name);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao baixar arquivo',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Excluir anexo
     */
    public function destroy(Request $request, $id)
    {
        try {
            $attachment = Attachment::findOrFail($id);
            $user = $request->user();
            $board = $attachment->card->list->board;

            // Verificar permissão (autor, dono do quadro ou admin/moderador)
            if ($attachment->user_id !== $user->id && $board->user_id !== $user->id) {
                $role = $board->getMemberRole($user->id);
                if (!in_array($role, ['admin', 'moderator'])) {
                    return response()->json([
                        'message' => 'Você não tem permissão para excluir este anexo',
                    ], 403);
                }
            }

            // Excluir arquivo do storage
            Storage::disk('public')->delete($attachment->file_path);
            $attachment->delete();

            return response()->json([
                'message' => 'Anexo excluído com sucesso',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao excluir anexo',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}