<?php

namespace Database\Factories;

use App\Models\Board;
use Illuminate\Database\Eloquent\Factories\Factory;

class ListFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = \App\Models\ListModel::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'board_id' => Board::factory(),
            'title' => fake()->word(),
            'position' => fake()->numberBetween(1, 10),
        ];
    }
}