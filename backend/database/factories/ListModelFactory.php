<?php

namespace Database\Factories;

use App\Models\ListModel;
use Illuminate\Database\Eloquent\Factories\Factory;

class ListModelFactory extends Factory
{
    protected $model = ListModel::class;

    public function definition(): array
    {
        return [
            'board_id' => 1,
            'title' => fake()->randomElement(['A Fazer', 'Em Progresso', 'Concluído', 'Backlog', 'Revisão']),
            'position' => 1,
        ];
    }
}