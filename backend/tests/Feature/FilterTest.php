<?php

namespace Tests\Feature;

use App\Models\Board;
use App\Models\Card;
use App\Models\Label;
use App\Models\ListModel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FilterTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Board $board;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->board = Board::factory()->create(['user_id' => $this->user->id]);
    }

    private function authHeaders(): array
    {
        $token = $this->user->createToken('test-token')->plainTextToken;
        return ['Authorization' => "Bearer $token"];
    }

    public function test_board_includes_cards_with_labels()
    {
        $list = ListModel::factory()->create(['board_id' => $this->board->id, 'position' => 1]);
        $card = Card::factory()->create(['list_id' => $list->id, 'position' => 1]);
        $label = Label::factory()->create(['board_id' => $this->board->id]);

        $card->labels()->attach($label->id);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson("/api/boards/{$this->board->id}");

        $response->assertStatus(200);
        $cards = $response->json('lists.0.cards');
        $this->assertCount(1, $cards);
        $this->assertCount(1, $cards[0]['labels']);
        $this->assertEquals($label->name, $cards[0]['labels'][0]['name']);
    }

    public function test_board_includes_cards_with_due_date()
    {
        $list = ListModel::factory()->create(['board_id' => $this->board->id, 'position' => 1]);
        Card::factory()->create([
            'list_id' => $list->id,
            'position' => 1,
            'due_date' => now()->addDays(3)->toDateString(),
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson("/api/boards/{$this->board->id}");

        $response->assertStatus(200);
        $cards = $response->json('lists.0.cards');
        $this->assertNotNull($cards[0]['due_date']);
    }

    public function test_board_returns_empty_when_no_cards()
    {
        ListModel::factory()->create(['board_id' => $this->board->id, 'position' => 1]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson("/api/boards/{$this->board->id}");

        $response->assertStatus(200);
        $cards = $response->json('lists.0.cards');
        $this->assertCount(0, $cards);
    }

    public function test_cards_filtered_by_label_client_side()
    {
        $list = ListModel::factory()->create(['board_id' => $this->board->id, 'position' => 1]);
        $card = Card::factory()->create(['list_id' => $list->id, 'position' => 1]);
        $label = Label::factory()->create(['board_id' => $this->board->id, 'name' => 'Urgente', 'color' => '#EF4444']);

        $card->labels()->attach($label->id);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson("/api/boards/{$this->board->id}");

        $response->assertStatus(200);
        $labels = $response->json('labels');
        $this->assertCount(1, $labels);
        $this->assertEquals('Urgente', $labels[0]['name']);
    }

    public function test_user_cannot_access_other_users_board()
    {
        $otherUser = User::factory()->create();
        $otherBoard = Board::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson("/api/boards/{$otherBoard->id}");

        $response->assertStatus(403);
    }
}