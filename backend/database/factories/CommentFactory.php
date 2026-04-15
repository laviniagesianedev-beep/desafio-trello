<?php

namespace Database\Factories;

use App\Models\Card;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CommentFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = \App\Models\Comment::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'card_id' => Card::factory(),
            'user_id' => User::factory(),
            'content' => fake()->paragraph(),
            'parent_id' => null,
        ];
    }
}