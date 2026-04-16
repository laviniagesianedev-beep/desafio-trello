<?php

namespace Database\Factories;

use App\Models\Card;
use Illuminate\Database\Eloquent\Factories\Factory;

class ChecklistItemFactory extends Factory
{
    protected $model = \App\Models\ChecklistItem::class;

    public function definition(): array
    {
        return [
            'card_id' => Card::factory(),
            'content' => fake()->sentence(),
            'is_checked' => false,
            'position' => 1,
        ];
    }
}
