<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\BoardController;
use App\Http\Controllers\API\ListController;
use App\Http\Controllers\API\CardController;
use App\Http\Controllers\API\CommentController;
use App\Http\Controllers\API\AttachmentController;
use App\Http\Controllers\API\MemberController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Rotas públicas de autenticação
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Rotas protegidas por autenticação
Route::middleware('auth:sanctum')->group(function () {
    // Usuário atual
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Quadros
    Route::apiResource('boards', BoardController::class);
    Route::get('/boards/shared', [BoardController::class, 'shared']);
    Route::get('/boards/archived', [BoardController::class, 'archived']);
    
    // Listas (dentro de um quadro)
    Route::apiResource('boards.lists', ListController::class)->shallow();
    Route::put('/lists/{list}/reorder', [ListController::class, 'reorder']);
    
    // Cards (dentro de uma lista)
    Route::apiResource('lists.cards', CardController::class)->shallow();
    Route::put('/cards/{card}/reorder', [CardController::class, 'reorder']);
    Route::put('/cards/{card}/move', [CardController::class, 'move']);
    Route::put('/cards/{card}/archive', [CardController::class, 'archive']);
    
    // Comentários
    Route::apiResource('cards.comments', CommentController::class)->shallow();
    
    // Anexos
    Route::apiResource('cards.attachments', AttachmentController::class)->shallow();
    
    // Membros
    Route::apiResource('boards.members', MemberController::class)->shallow();
    Route::put('/boards/{board}/members/{member}/role', [MemberController::class, 'updateRole']);
});

// Rota de health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});