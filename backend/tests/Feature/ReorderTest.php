<?php

namespace Tests\Feature;

use App\Models\Board;
use App\Models\Card;
use App\Models\ListModel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReorderTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Board $board;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->board = Board::create([
            'user_id' => $this->user->id,
            'title' => 'Quadro Teste',
            'background' => '#A8D8EA',
        ]);
    }

    private function authHeaders(): array
    {
        $token = $this->user->createToken('test-token')->plainTextToken;
        return ['Authorization' => "Bearer $token"];
    }

    private function createList(string $title = 'Lista Teste', int $position = 1): ListModel
    {
        return ListModel::create([
            'board_id' => $this->board->id,
            'title' => $title,
            'position' => $position,
        ]);
    }

    private function createCard(ListModel $list, string $title = 'Card Teste', int $position = 1): Card
    {
        return Card::create([
            'list_id' => $list->id,
            'user_id' => $this->user->id,
            'title' => $title,
            'position' => $position,
        ]);
    }

    public function test_reorder_card_from_position_3_to_1()
    {
        $list = $this->createList();
        $card1 = $this->createCard($list, 'Card 1', 1);
        $card2 = $this->createCard($list, 'Card 2', 2);
        $card3 = $this->createCard($list, 'Card 3', 3);

        $response = $this->withHeaders($this->authHeaders())
            ->putJson("/api/cards/{$card3->id}/reorder", ['position' => 1]);

        $response->assertStatus(200);
        $this->assertEquals(1, $card3->fresh()->position);
        $this->assertEquals(2, $card1->fresh()->position);
        $this->assertEquals(3, $card2->fresh()->position);
    }

    public function test_reorder_card_same_position_does_not_change_others()
    {
        $list = $this->createList();
        $card1 = $this->createCard($list, 'Card 1', 1);
        $card2 = $this->createCard($list, 'Card 2', 2);

        $response = $this->withHeaders($this->authHeaders())
            ->putJson("/api/cards/{$card1->id}/reorder", ['position' => 1]);

        $response->assertStatus(200);
        $this->assertEquals(1, $card1->fresh()->position);
        $this->assertEquals(2, $card2->fresh()->position);
    }

    public function test_move_card_between_lists()
    {
        $list1 = $this->createList('Lista 1', 1);
        $list2 = $this->createList('Lista 2', 2);
        $card = $this->createCard($list1, 'Card Mover', 1);

        $response = $this->withHeaders($this->authHeaders())
            ->putJson("/api/cards/{$card->id}/move", [
                'list_id' => $list2->id,
                'position' => 1,
            ]);

        $response->assertStatus(200);
        $this->assertEquals($list2->id, $card->fresh()->list_id);
        $this->assertEquals(1, $card->fresh()->position);
    }

    public function test_move_card_to_different_board_fails()
    {
        $otherUser = User::factory()->create();
        $otherBoard = Board::create([
            'user_id' => $otherUser->id,
            'title' => 'Outro Quadro',
            'background' => '#FFD3B6',
        ]);
        $otherList = ListModel::create([
            'board_id' => $otherBoard->id,
            'title' => 'Outra Lista',
            'position' => 1,
        ]);

        $list = $this->createList();
        $card = $this->createCard($list, 'Card Teste', 1);

        $response = $this->withHeaders($this->authHeaders())
            ->putJson("/api/cards/{$card->id}/move", [
                'list_id' => $otherList->id,
                'position' => 1,
            ]);

        $response->assertStatus(400);
    }

    public function test_reorder_list_within_board()
    {
        $list1 = $this->createList('Lista 1', 1);
        $list2 = $this->createList('Lista 2', 2);
        $list3 = $this->createList('Lista 3', 3);

        $response = $this->withHeaders($this->authHeaders())
            ->putJson("/api/lists/{$list3->id}/reorder", ['position' => 1]);

        $response->assertStatus(200);
        $this->assertEquals(1, $list3->fresh()->position);
        $this->assertEquals(2, $list1->fresh()->position);
        $this->assertEquals(3, $list2->fresh()->position);
    }

    public function test_regression_create_list_card_reorder_reload_maintains_order()
    {
        $list = $this->createList('Lista Teste', 1);
        $card1 = $this->createCard($list, 'Card A', 1);
        $card2 = $this->createCard($list, 'Card B', 2);
        $card3 = $this->createCard($list, 'Card C', 3);

        $this->withHeaders($this->authHeaders())
            ->putJson("/api/cards/{$card3->id}/reorder", ['position' => 1]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson("/api/boards/{$this->board->id}");

        $response->assertStatus(200);
        $cards = $response->json('lists.0.cards');
        $this->assertEquals('Card C', $cards[0]['title']);
        $this->assertEquals('Card A', $cards[1]['title']);
        $this->assertEquals('Card B', $cards[2]['title']);
    }

    public function test_unauthenticated_user_cannot_reorder()
    {
        $list = $this->createList();
        $card = $this->createCard($list);

        $response = $this->putJson("/api/cards/{$card->id}/reorder", ['position' => 1]);
        $response->assertStatus(401);
    }
}