<?php

namespace Tests\Feature;

use App\Models\Board;
use App\Models\Card;
use App\Models\ListModel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BoardTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    private function authHeaders(): array
    {
        $token = $this->user->createToken('test-token')->plainTextToken;
        return ['Authorization' => "Bearer $token"];
    }

    public function test_user_can_create_board()
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/boards', [
                'title' => 'Meu Quadro',
                'description' => 'Descrição do quadro',
                'background' => '#A8D8EA',
            ]);

        $response->assertStatus(201)
            ->assertJson(['title' => 'Meu Quadro']);

        $this->assertDatabaseHas('boards', ['title' => 'Meu Quadro']);
    }

    public function test_user_can_list_own_boards()
    {
        Board::factory()->count(3)->create(['user_id' => $this->user->id]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/boards');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('owned'));
    }

    public function test_user_can_update_board()
    {
        $board = Board::factory()->create(['user_id' => $this->user->id]);

        $response = $this->withHeaders($this->authHeaders())
            ->putJson("/api/boards/{$board->id}", [
                'title' => 'Novo Título',
                'description' => 'Nova descrição',
                'background' => '#FFD3B6',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('Novo Título', $board->fresh()->title);
        $this->assertEquals('#FFD3B6', $board->fresh()->background);
    }

    public function test_user_can_delete_board()
    {
        $board = Board::factory()->create(['user_id' => $this->user->id]);

        $response = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/boards/{$board->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('boards', ['id' => $board->id]);
    }

    public function test_user_cannot_delete_other_users_board()
    {
        $otherUser = User::factory()->create();
        $otherBoard = Board::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/boards/{$otherBoard->id}");

        $response->assertStatus(403);
    }

    public function test_board_show_includes_lists_and_cards()
    {
        $board = Board::factory()->create(['user_id' => $this->user->id]);
        $list = ListModel::factory()->create(['board_id' => $board->id, 'position' => 1]);
        Card::factory()->create(['list_id' => $list->id, 'position' => 1]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson("/api/boards/{$board->id}");

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('lists'));
        $this->assertCount(1, $response->json('lists.0.cards'));
    }

    public function test_create_board_requires_title()
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/boards', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title']);
    }
}