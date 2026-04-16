<?php

namespace App\Domain\Boards\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Board extends Model
{
    use HasFactory;

    /**
     * Atributos que podem ser preenchidos em massa
     */
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'background',
        'archived_at',
    ];

    /**
     * Atributos que devem ser convertidos
     */
    protected $casts = [
        'archived_at' => 'datetime',
    ];

    /**
     * Dono do quadro
     */
    public function owner()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }

    /**
     * Membros do quadro
     */
    public function members()
    {
        return $this->belongsToMany(\App\Models\User::class, 'board_user')
                    ->withPivot('role')
                    ->withTimestamps();
    }

    /**
     * Listas do quadro
     */
    public function lists()
    {
        return $this->hasMany(\App\Domain\Lists\Models\ListModel::class, 'board_id')
                    ->orderBy('position');
    }

    /**
     * Cards do quadro (através das listas)
     */
    public function cards()
    {
        return $this->hasManyThrough(\App\Domain\Cards\Models\Card::class, \App\Domain\Lists\Models\ListModel::class, 'board_id', 'list_id');
    }

    /**
     * Labels do quadro
     */
    public function labels()
    {
        return $this->hasMany(\App\Domain\Labels\Models\Label::class);
    }

    /**
     * Verificar se um usuário é membro
     */
    public function hasMember($userId)
    {
        return $this->members()->where('user_id', $userId)->exists();
    }

    /**
     * Obter papel de um membro
     */
    public function getMemberRole($userId)
    {
        $member = $this->members()->where('user_id', $userId)->first();
        return $member ? $member->pivot->role : null;
    }

    /**
     * Adicionar membro
     */
    public function addMember($userId, $role = 'normal')
    {
        return $this->members()->attach($userId, ['role' => $role]);
    }

    /**
     * Remover membro
     */
    public function removeMember($userId)
    {
        return $this->members()->detach($userId);
    }

    /**
     * Atualizar papel de membro
     */
    public function updateMemberRole($userId, $role)
    {
        return $this->members()->updateExistingPivot($userId, ['role' => $role]);
    }

    /**
     * Arquivar quadro
     */
    public function archive()
    {
        $this->archived_at = now();
        $this->save();
    }

    /**
     * Restaurar quadro
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
     * Scope para quadros ativos
     */
    public function scopeActive($query)
    {
        return $query->whereNull('archived_at');
    }

    /**
     * Scope para quadros arquivados
     */
    public function scopeArchived($query)
    {
        return $query->whereNotNull('archived_at');
    }
}