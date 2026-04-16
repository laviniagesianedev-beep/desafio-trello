<?php

namespace App\Services;

use App\Domain\Cards\Models\Card;
use App\Domain\Lists\Models\ListModel;

class ReorderService
{
    public function reorderCard(int $cardId, int $position): Card
    {
        $card = Card::findOrFail($cardId);

        $otherCards = $card->list->cards()
            ->where('id', '!=', $cardId)
            ->orderBy('position')
            ->get();

        $currentPos = 1;
        foreach ($otherCards as $otherCard) {
            if ($currentPos === $position) {
                $currentPos++;
            }
            $otherCard->position = $currentPos;
            $otherCard->save();
            $currentPos++;
        }

        $card->position = $position;
        $card->save();

        return $card;
    }

    public function moveCard(int $cardId, int $targetListId, int $position): Card
    {
        $card = Card::findOrFail($cardId);
        $oldListId = $card->list_id;

        $card->list_id = $targetListId;
        $card->position = $position;
        $card->save();

        $this->reorganizeCards($oldListId, $cardId);
        $this->reorganizeCards($targetListId, $cardId);

        return $card->fresh();
    }

    public function reorderList(int $listId, int $position): ListModel
    {
        $list = ListModel::findOrFail($listId);

        $otherLists = $list->board->lists()
            ->where('id', '!=', $listId)
            ->orderBy('position')
            ->get();

        $currentPos = 1;
        foreach ($otherLists as $otherList) {
            if ($currentPos === $position) {
                $currentPos++;
            }
            $otherList->position = $currentPos;
            $otherList->save();
            $currentPos++;
        }

        $list->position = $position;
        $list->save();

        return $list;
    }

    public function moveCardsToList(int $sourceListId, int $targetListId): void
    {
        $sourceList = ListModel::with('cards')->findOrFail($sourceListId);
        $targetList = ListModel::findOrFail($targetListId);

        foreach ($sourceList->cards as $card) {
            $card->list_id = $targetListId;
            $card->position = $targetList->cards()->max('position') + 1 + $card->position;
            $card->save();
        }

        $this->reorganizeCards($targetListId);
    }

    private function reorganizeCards(int $listId, ?int $excludeCardId = null): void
    {
        $query = Card::where('list_id', $listId);

        if ($excludeCardId) {
            $query->where('id', '!=', $excludeCardId);
        }

        $cards = $query->orderBy('position')->get();

        foreach ($cards as $index => $card) {
            $card->position = $index + 1;
            $card->save();
        }
    }
}