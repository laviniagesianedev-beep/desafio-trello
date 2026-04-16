<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Board;
use App\Models\ListModel;
use App\Models\Card;
use App\Models\Comment;
use App\Models\ChecklistItem;
use App\Models\Label;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // =====================
        // USUÁRIOS
        // =====================
        
        $lavinia = User::factory()->create([
            'name' => 'Lavinia Gesiane',
            'email' => 'lavinia.gesiane.dev@b2pro.com.br',
            'password' => Hash::make('Password123*'),
        ]);

        $lali = User::factory()->create([
            'name' => 'Lalige Santos',
            'email' => 'laligesiane@gmail.com',
            'password' => Hash::make('Password123*'),
        ]);

        $fehge = User::factory()->create([
            'name' => 'Fehge Silva',
            'email' => 'fehgesiane@gmail.com',
            'password' => Hash::make('Senha123*'),
        ]);

        // Usuários aleatórios
        $usuariosAleatorios = User::factory(7)->create();

        $todosUsuarios = collect([$lavinia, $lali, $fehge])->merge($usuariosAleatorios);

        // =====================
        // QUADROS
        // =====================

        // Quadro da Lalige - Projeto Trello Clone
        $trelloLali = Board::factory()->create([
            'user_id' => $lali->id,
            'title' => 'Trello Clone',
            'description' => 'Clone do Trello com React e Laravel',
            'background' => '#A8D8EA',
        ]);

        // Quadro da Lalige - Marketing Digital
        $marketingLali = Board::factory()->create([
            'user_id' => $lali->id,
            'title' => 'Marketing Digital',
            'description' => 'Campanhas e estratégias de marketing',
            'background' => '#FCBAD3',
        ]);

        // Quadro da Lavinia - Desenvolvimento Web
        $devWebLavinia = Board::factory()->create([
            'user_id' => $lavinia->id,
            'title' => 'Desenvolvimento Web',
            'description' => 'Projetos e tarefas de desenvolvimento',
            'background' => '#AA96DA',
        ]);

        // Quadro da Fehge - Planejamento de Férias
        $feriasFehge = Board::factory()->create([
            'user_id' => $fehge->id,
            'title' => 'Planejamento de Férias',
            'description' => 'Organização da viagem de fim de ano',
            'background' => '#A8E6CF',
        ]);

        // Quadro compartilhado (membros)
        $projetoGeral = Board::factory()->create([
            'user_id' => $lavinia->id,
            'title' => 'Projeto Geral B2PRO',
            'description' => 'Quadro compartilhado para o time',
            'background' => '#FFFFD2',
        ]);

        // Adicionar membros ao quadro compartilhado
        $projetoGeral->members()->attach($lali->id, ['role' => 'admin']);
        $projetoGeral->members()->attach($fehge->id, ['role' => 'moderator']);

        // Quadros aleatórios para outros usuários
        $usuariosAleatorios->each(function ($usuario) use ($todosUsuarios) {
            $numQuadros = rand(2, 4);
            $cores = ['#A8D8EA', '#AA96DA', '#FCBAD3', '#FFFFD2', '#FFD3B6', '#FFAAA5', '#A8E6CF', '#C7CEEA'];
            $titulos = [' backlog', ' Sprint Atual', ' Ideias', ' Projetos Pessoais', ' Trabalho', ' Estudos', ' Lançamentos', ' Correções'];
            
            for ($i = 0; $i < $numQuadros; $i++) {
                $board = Board::factory()->create([
                    'user_id' => $usuario->id,
                    'title' => fake()->randomElement($titulos),
                    'background' => fake()->randomElement($cores),
                ]);

                // Alguns quadros compartilhados
                if (rand(0, 1)) {
                    $outroUsuario = $todosUsuarios->except($usuario->id)->random();
                    $roles = ['normal', 'moderator', 'observer'];
                    $board->members()->attach($outroUsuario->id, ['role' => fake()->randomElement($roles)]);
                }
            }
        });

        // =====================
        // LABELS
        // =====================

        $labelsData = [
            ['name' => 'Urgente', 'color' => '#EF4444'],
            ['name' => 'Importante', 'color' => '#F97316'],
            ['name' => 'Em breve', 'color' => '#F59E0B'],
            ['name' => 'Feature', 'color' => '#22C55E'],
            ['name' => 'Bug', 'color' => '#EC4899'],
            ['name' => 'Documentação', 'color' => '#3B82F6'],
            ['name' => 'Revisão', 'color' => '#8B5CF6'],
            ['name' => 'Design', 'color' => '#D946EF'],
        ];

        foreach ([$trelloLali, $marketingLali, $devWebLavinia, $feriasFehge, $projetoGeral] as $board) {
            foreach ($labelsData as $label) {
                Label::factory()->create([
                    'board_id' => $board->id,
                    'name' => $label['name'],
                    'color' => $label['color'],
                ]);
            }
        }

        // =====================
        // LISTAS E CARDS
        // =====================

        // Trello Clone
        $this->criarListasECards($trelloLali, $lali, [
            [
                'titulo' => 'A Fazer',
                'cards' => [
                    [
                        'titulo' => 'Implementar autenticação JWT',
                        'descricao' => '<p>Implementar sistema de <strong>autenticação JWT</strong> com refresh tokens.</p><ul><li>Login</li><li>Logout</li><li>Token refresh</li></ul>',
                        'posicao' => 1,
                        'labels' => ['Feature'],
                        'checklist' => ['Criar endpoint de login', 'Implementar JWT', 'Criar middleware de autenticação', 'Testar fluxo completo'],
                        'comentarios' => ['Vamos usar Sanctum do Laravel!'],
                    ],
                    [
                        'titulo' => 'Configurar banco de dados',
                        'descricao' => '<p>Configurar PostgreSQL com Docker Compose.</p>',
                        'posicao' => 2,
                        'labels' => ['Urgente'],
                    ],
                    [
                        'titulo' => 'Criar componentes React',
                        'posicao' => 3,
                        'labels' => ['Feature'],
                    ],
                ],
            ],
            [
                'titulo' => 'Em Progresso',
                'cards' => [
                    [
                        'titulo' => 'Implementar drag-and-drop',
                        'descricao' => '<p>Usar <strong>dnd-kit</strong> para drag and drop de cards entre listas.</p>',
                        'posicao' => 1,
                        'data_entrega' => now()->addDays(3)->format('Y-m-d'),
                        'labels' => ['Feature', 'Importante'],
                        'comentarios' => ['Já estamos no processo de implementação!'],
                    ],
                    [
                        'titulo' => 'Criar API REST',
                        'posicao' => 2,
                        'labels' => ['Feature'],
                    ],
                ],
            ],
            [
                'titulo' => 'Revisão',
                'cards' => [
                    [
                        'titulo' => 'Revisar código do backend',
                        'posicao' => 1,
                        'labels' => ['Revisão'],
                    ],
                ],
            ],
            [
                'titulo' => 'Concluído',
                'cards' => [
                    [
                        'titulo' => 'Setup inicial do projeto',
                        'descricao' => '<p>Projeto criado com Vite + React + TypeScript.</p>',
                        'posicao' => 1,
                        'labels' => ['Documentação'],
                    ],
                    [
                        'titulo' => 'Design System',
                        'descricao' => '<p>Definir tokens de design e variáveis CSS.</p>',
                        'posicao' => 2,
                        'labels' => ['Design'],
                    ],
                ],
            ],
        ]);

        // Marketing Digital
        $this->criarListasECards($marketingLali, $lali, [
            [
                'titulo' => 'Ideias',
                'cards' => [
                    ['titulo' => 'Campanha de Inbound Marketing', 'posicao' => 1, 'labels' => ['Importante']],
                    ['titulo' => 'Posts para Instagram', 'posicao' => 2, 'labels' => ['Design']],
                    ['titulo' => 'Newsletter semanal', 'posicao' => 3],
                ],
            ],
            [
                'titulo' => 'Em Execução',
                'cards' => [
                    [
                        'titulo' => 'Campanha de Páscoa',
                        'posicao' => 1,
                        'data_entrega' => now()->addDays(7)->format('Y-m-d'),
                        'labels' => ['Urgente', 'Importante'],
                    ],
                ],
            ],
            [
                'titulo' => 'Finalizado',
                'cards' => [
                    ['titulo' => 'Campanha de Carnaval', 'posicao' => 1, 'labels' => ['Feature']],
                ],
            ],
        ]);

        // Desenvolvimento Web
        $this->criarListasECards($devWebLavinia, $lavinia, [
            [
                'titulo' => 'Backlog',
                'cards' => [
                    ['titulo' => 'Aprender TypeScript', 'posicao' => 1, 'labels' => ['Documentação']],
                    ['titulo' => 'Estudar React Hooks', 'posicao' => 2, 'labels' => ['Documentação']],
                    ['titulo' => 'Praticar Python', 'posicao' => 3, 'labels' => ['Feature']],
                ],
            ],
            [
                'titulo' => 'Aprendendo',
                'cards' => [
                    [
                        'titulo' => 'Laravel + Sanctum',
                        'descricao' => '<p>Aprendendo autenticação com <strong>Sanctum</strong>.</p>',
                        'posicao' => 1,
                        'data_entrega' => now()->addDays(5)->format('Y-m-d'),
                        'labels' => ['Importante'],
                        'checklist' => ['Configurar Sanctum', 'Criar endpoints', 'Testar autenticação'],
                    ],
                ],
            ],
            [
                'titulo' => 'Projetado',
                'cards' => [
                    ['titulo' => 'API REST completa', 'posicao' => 1, 'labels' => ['Feature']],
                ],
            ],
            [
                'titulo' => 'Deploy',
                'cards' => [
                    ['titulo' => 'Deploy no Railway', 'posicao' => 1, 'labels' => ['Urgente'], 'data_entrega' => now()->addDays(10)->format('Y-m-d')],
                ],
            ],
        ]);

        // Planejamento de Férias
        $this->criarListasECards($feriasFehge, $fehge, [
            [
                'titulo' => 'Destino',
                'cards' => [
                    [
                        'titulo' => 'Escolher destino',
                        'posicao' => 1,
                        'labels' => ['Importante'],
                        'checklist' => ['Pesquisar destinos', 'Verificar preços', 'Checar documentação necessária'],
                    ],
                    ['titulo' => 'Passagens aéreas', 'posicao' => 2, 'labels' => ['Urgente']],
                ],
            ],
            [
                'titulo' => 'A fazer antes de viajar',
                'cards' => [
                    ['titulo' => 'Reservar hotel', 'posicao' => 1, 'labels' => ['Importante']],
                    ['titulo' => 'Seguro viagem', 'posicao' => 2],
                    ['titulo' => 'Trocar dinheiro', 'posicao' => 3],
                    ['titulo' => 'Avisar no trabalho', 'posicao' => 4],
                ],
            ],
            [
                'titulo' => 'Checklist de viagem',
                'cards' => [
                    ['titulo' => 'Passaporte', 'posicao' => 1, 'labels' => ['Urgente']],
                    ['titulo' => 'Roupas', 'posicao' => 2],
                    ['titulo' => 'Medicamentos', 'posicao' => 3],
                    ['titulo' => 'Carregador', 'posicao' => 4],
                    ['titulo' => 'Câmera', 'posicao' => 5],
                ],
            ],
        ]);

        // Projeto Geral B2PRO
        $this->criarListasECards($projetoGeral, $lavinia, [
            [
                'titulo' => 'Tarefas',
                'cards' => [
                    [
                        'titulo' => 'Reunião semanal',
                        'posicao' => 1,
                        'data_entrega' => now()->addDays(1)->format('Y-m-d'),
                        'labels' => ['Urgente'],
                        'comentarios' => ['Lembrar de preparar a apresentação!'],
                    ],
                    ['titulo' => 'Atualizar documentação', 'posicao' => 2, 'labels' => ['Documentação']],
                    ['titulo' => 'Code review', 'posicao' => 3, 'labels' => ['Revisão']],
                ],
            ],
            [
                'titulo' => 'Em Andamento',
                'cards' => [
                    ['titulo' => 'Desenvolvimento da feature X', 'posicao' => 1, 'labels' => ['Feature', 'Importante']],
                ],
            ],
            [
                'titulo' => 'Concluído',
                'cards' => [
                    ['titulo' => 'Setup do projeto', 'posicao' => 1],
                    ['titulo' => 'Design inicial', 'posicao' => 2, 'labels' => ['Design']],
                ],
            ],
        ]);

        $this->command->info('Seed concluído com sucesso!');
        $this->command->info('Usuários criados: ' . User::count());
        $this->command->info('Quadros criados: ' . Board::count());
        $this->command->info('Listas criadas: ' . ListModel::count());
        $this->command->info('Cards criados: ' . Card::count());
    }

    /**
     * Criar listas e cards para um quadro
     */
    private function criarListasECards(Board $board, User $dono, array $listas): void
    {
        $boardLabels = $board->labels()->get();
        $position = 1;

        foreach ($listas as $listaData) {
            $lista = ListModel::factory()->create([
                'board_id' => $board->id,
                'title' => $listaData['titulo'],
                'position' => $position++,
            ]);

            foreach ($listaData['cards'] as $cardData) {
                $card = Card::factory()->create([
                    'list_id' => $lista->id,
                    'user_id' => $dono->id,
                    'title' => $cardData['titulo'],
                    'description' => $cardData['descricao'] ?? null,
                    'position' => $cardData['posicao'] ?? 1,
                    'due_date' => $cardData['data_entrega'] ?? null,
                ]);

                // Adicionar labels aleatórios
                if (isset($cardData['labels']) && count($boardLabels)) {
                    $labelsNomes = $cardData['labels'];
                    $cardLabels = $boardLabels->filter(fn($l) => in_array($l->name, $labelsNomes));
                    if ($cardLabels->count()) {
                        $card->labels()->attach($cardLabels->pluck('id'));
                    }
                }

                // Adicionar checklist em alguns cards
                if (isset($cardData['checklist'])) {
                    $checkPosition = 1;
                    foreach ($cardData['checklist'] as $item) {
                        ChecklistItem::factory()->create([
                            'card_id' => $card->id,
                            'content' => $item,
                            'is_checked' => rand(0, 1) ? true : false,
                            'position' => $checkPosition++,
                        ]);
                    }
                }

                // Adicionar comentários
                if (isset($cardData['comentarios'])) {
                    foreach ($cardData['comentarios'] as $comentario) {
                        Comment::factory()->create([
                            'card_id' => $card->id,
                            'user_id' => $dono->id,
                            'content' => '<p>' . $comentario . '</p>',
                        ]);
                    }
                }
            }
        }
    }
}
