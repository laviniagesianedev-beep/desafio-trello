<?php

namespace App\Domain\Lists\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ListModel extends Model
{
    use HasFactory;

    /**
     * Nome da tabela
     */
    protected $table = 'lists';

    /**
     * Atributos que podem ser preenchidos em massa
     */
    protected $fillable = [
        'board_id',
        'title',
        'position',
    ];

    /**
     * Quadro ao qual a lista pertence
     */
    public function board()
    {
        return $this->belongsTo(\App\Domain\Boards\Models\Board::class);
    }

    /**
     * Cards da lista
     */
    public function cards()
    {
        return $this->hasMany(\App\Domain\Cards\Models\Card::class, 'list_id')
                    ->orderBy('position');
    }

    /**
     * Mover para uma nova posição
     */
    public function moveTo($newPosition)
    {
        $lists = $this->board->lists()->where('id', '!=', $this->id)->get();
        
        // Atualizar posições das outras listas
        foreach ($lists as $list) {
            if ($list->position >= $newPosition) {
                $list->position++;
                $list->save();
            }
        }
        
        $this->position = $newPosition;
        $this->save();
        
        return $this;
    }

    /**
     * Obter próxima posição
     */
    public function getNextPosition()
    {
        $maxPosition = $this->board->lists()->max('position');
        return $maxPosition ? $maxPosition + 1 : 1;
    }

    /**
     * Reorganizar posições dos cards
     */
    public function reorganizeCards()
    {
        $cards = $this->cards()->orderBy('position')->get();
        foreach ($cards as $index => $card) {
            $card->position = $index + 1;
            $card->save();
        }
    }
}