<?php

namespace Database\Factories;

use App\Models\ListModel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CardFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = \App\Models\Card::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'list_id' => ListModel::factory(),
            'user_id' => User::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'position' => fake()->numberBetween(1, 20),
            'due_date' => fake()->dateTimeBetween('now', '+30 days'),
            'archived_at' => null,
        ];
    }

    /**
     * Indicate that the card is archived.
     */
    public function archived(): static
    {
        return $this->state(fn (array $attributes) => [
            'archived_at' => now(),
        ]);
    }
}