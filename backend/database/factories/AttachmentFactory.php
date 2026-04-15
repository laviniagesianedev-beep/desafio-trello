<?php

namespace Database\Factories;

use App\Models\Card;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AttachmentFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = \App\Models\Attachment::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'card_id' => Card::factory(),
            'user_id' => User::factory(),
            'file_path' => 'attachments/' . fake()->uuid() . '.jpg',
            'file_name' => fake()->fileName('jpg'),
            'file_size' => fake()->numberBetween(1000, 10000000),
            'file_type' => fake()->randomElement(['image/jpeg', 'image/png', 'application/pdf']),
        ];
    }
}