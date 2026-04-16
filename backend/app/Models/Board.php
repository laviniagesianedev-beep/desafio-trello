<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @deprecated Use \App\Domain\Boards\Models\Board instead
 * @method static \App\Domain\Boards\Models\Board findOrFail($id)
 * @method static \App\Domain\Boards\Models\Board create(array $attributes)
 * @method static \App\Domain\Boards\Models\Board where(string $column, $operator = null, $value = null)
 */
class Board extends \App\Domain\Boards\Models\Board
{
    use HasFactory;
}