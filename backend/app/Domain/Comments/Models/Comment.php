<?php

namespace App\Domain\Comments\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;

    /**
     * Atributos que podem ser preenchidos em massa
     */
    protected $fillable = [
        'card_id',
        'user_id',
        'parent_id',
        'content',
    ];

    /**
     * Card ao qual o comentário pertence
     */
    public function card()
    {
        return $this->belongsTo(\App\Domain\Cards\Models\Card::class);
    }

    /**
     * Autor do comentário
     */
    public function author()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }

    /**
     * Comentários pai (para replies futuros)
     */
    public function parent()
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    /**
     * Comentários filho (replies)
     */
    public function replies()
    {
        return $this->hasMany(Comment::class, 'parent_id');
    }
}