<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Criar usuário de teste
        User::factory()->create([
            'name' => 'Lavinia',
            'email' => 'lavinia.gesiane.dev@b2pro.com.br',
            'password' => bcrypt('Password123!'),
        ]);

        // Criar mais alguns usuários
        User::factory(5)->create();
    }
}