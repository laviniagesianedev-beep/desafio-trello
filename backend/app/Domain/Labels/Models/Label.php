<?php

namespace App\Domain\Labels\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Label extends Model
{
    use HasFactory;

    protected $fillable = [
        'board_id',
        'name',
        'color',
    ];

    public function board()
    {
        return $this->belongsTo(\App\Domain\Boards\Models\Board::class);
    }

    public function cards()
    {
        return $this->belongsToMany(\App\Domain\Cards\Models\Card::class, 'card_label')
                    ->withTimestamps();
    }
}