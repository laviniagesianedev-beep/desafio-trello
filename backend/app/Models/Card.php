<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Card extends Model
{
    use HasFactory;

    /**
     * Atributos que podem ser preenchidos em massa
     */
    protected $fillable = [
        'list_id',
        'user_id',
        'title',
        'description',
        'position',
        'due_date',
        'archived_at',
    ];

    /**
     * Atributos que devem ser convertidos
     */
    protected $casts = [
        'due_date' => 'datetime',
        'archived_at' => 'datetime',
    ];

    /**
     * Lista à qual o card pertence
     */
    public function list()
    {
        return $this->belongsTo(ListModel::class, 'list_id');
    }

    /**
     * Criador do card
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Comentários do card
     */
    public function comments()
    {
        return $this->hasMany(Comment::class)
                    ->orderBy('created_at', 'desc');
    }

    /**
     * Anexos do card
     */
    public function attachments()
    {
        return $this->hasMany(Attachment::class)
                    ->orderBy('created_at', 'desc');
    }

    /**
     * Membros atribuídos ao card
     */
    public function assignedMembers()
    {
        return $this->belongsToMany(User::class, 'card_user')
                    ->withTimestamps();
    }

    /**
     * Mover para uma nova posição
     */
    public function moveTo($newListId, $newPosition)
    {
        $oldListId = $this->list_id;
        $this->list_id = $newListId;
        $this->position = $newPosition;
        $this->save();

        // Reorganizar cards na lista antiga
        $this->reorganizeList($oldListId);
        
        // Reorganizar cards na nova lista
        $this->reorganizeList($newListId);

        return $this;
    }

    /**
     * Reorganizar posições em uma lista
     */
    protected function reorganizeList($listId)
    {
        $cards = Card::where('list_id', $listId)
                    ->where('id', '!=', $this->id)
                    ->orderBy('position')
                    ->get();

        foreach ($cards as $index => $card) {
            $card->position = $index + 1;
            $card->save();
        }
    }

    /**
     * Arquivar card
     */
    public function archive()
    {
        $this->archived_at = now();
        $this->save();
    }

    /**
     * Restaurar card
     */
    public function restore()
    {
        $this->archived_at = null;
        $this->save();
    }

    /**
     * Verificar se está arquivado
     */
    public function isArchived()
    {
        return $this->archived_at !== null;
    }

    /**
     * Scope para cards ativos
     */
    public function scopeActive($query)
    {
        return $query->whereNull('archived_at');
    }

    /**
     * Scope para cards arquivados
     */
    public function scopeArchived($query)
    {
        return $query->whereNotNull('archived_at');
    }

    /**
     * Obter próxima posição
     */
    public function getNextPosition()
    {
        $maxPosition = $this->list->cards()->max('position');
        return $maxPosition ? $maxPosition + 1 : 1;
    }
}