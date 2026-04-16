<?php

namespace Database\Factories;

use App\Models\Board;
use Illuminate\Database\Eloquent\Factories\Factory;

class LabelFactory extends Factory
{
    protected $model = \App\Models\Label::class;

    public function definition(): array
    {
        return [
            'board_id' => Board::factory(),
            'name' => fake()->randomElement(['Urgente', 'Bug', 'Feature', 'Melhoria', 'Documentação', 'Design']),
            'color' => fake()->randomElement(['#EF4444', '#F97316', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6']),
        ];
    }
}