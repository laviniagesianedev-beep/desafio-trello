<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Domain\Auth\Http\Controllers\AuthController;
use App\Domain\Boards\Http\Controllers\BoardController;
use App\Domain\Lists\Http\Controllers\ListController;
use App\Domain\Cards\Http\Controllers\CardController;
use App\Domain\Comments\Http\Controllers\CommentController;
use App\Domain\Attachments\Http\Controllers\AttachmentController;
use App\Domain\Members\Http\Controllers\MemberController;
use App\Domain\Labels\Http\Controllers\LabelController;
use App\Domain\Checklist\Http\Controllers\ChecklistItemController;

// Restrições de rota para evitar conflitos
Route::pattern('board', '[0-9]+');
Route::pattern('list', '[0-9]+');
Route::pattern('card', '[0-9]+');
Route::pattern('attachment', '[0-9]+');
Route::pattern('label', '[0-9]+');
Route::pattern('item', '[0-9]+');
Route::pattern('member', '[0-9]+');

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Rotas públicas de autenticação
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:3,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Rotas protegidas por autenticação
Route::middleware('auth:sanctum')->group(function () {
    // Usuário atual
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Quadros
    Route::get('/boards/shared', [BoardController::class, 'shared']);
    Route::get('/boards/archived', [BoardController::class, 'archived']);
    Route::put('/boards/{board}/archive', [BoardController::class, 'archive']);
    Route::put('/boards/{board}/restore', [BoardController::class, 'restore']);
    Route::apiResource('boards', BoardController::class);
    
    // Listas (dentro de um quadro)
    Route::apiResource('boards.lists', ListController::class)->shallow();
    Route::put('/lists/{list}/reorder', [ListController::class, 'reorder']);
    
    // Cards (dentro de uma lista)
    Route::apiResource('lists.cards', CardController::class)->shallow();
    Route::put('/cards/{card}/reorder', [CardController::class, 'reorder']);
    Route::put('/cards/{card}/move', [CardController::class, 'move']);
    Route::put('/cards/{card}/archive', [CardController::class, 'archive']);
    Route::put('/cards/{card}/restore', [CardController::class, 'restore']);
    Route::get('/boards/{board}/cards/archived', [CardController::class, 'archivedByBoard']);
    
    // Comentários
    Route::apiResource('cards.comments', CommentController::class)->shallow();
    
    // Anexos
    Route::apiResource('cards.attachments', AttachmentController::class)->shallow();
    Route::get('/attachments/{attachment}/download', [AttachmentController::class, 'download']);
    Route::get('/attachments/{attachment}/preview', [AttachmentController::class, 'preview']);
    
    // Membros
    Route::apiResource('boards.members', MemberController::class)->shallow();
    Route::put('/boards/{board}/members/{member}/role', [MemberController::class, 'updateRole']);

    // Labels
    Route::get('/boards/{board}/labels', [LabelController::class, 'index']);
    Route::post('/boards/{board}/labels', [LabelController::class, 'store']);
    Route::put('/labels/{label}', [LabelController::class, 'update']);
    Route::delete('/labels/{label}', [LabelController::class, 'destroy']);

    // Checklist Items
    Route::get('/cards/{card}/checklist', [ChecklistItemController::class, 'index']);
    Route::post('/cards/{card}/checklist', [ChecklistItemController::class, 'store']);
    Route::put('/checklist-items/{item}', [ChecklistItemController::class, 'update']);
    Route::delete('/checklist-items/{item}', [ChecklistItemController::class, 'destroy']);
});

// Rota de health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});