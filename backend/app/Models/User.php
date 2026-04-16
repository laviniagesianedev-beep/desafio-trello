<?php

namespace App\Models;

use App\Notifications\ResetPasswordNotification;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Send the password reset notification.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    /**
     * Atributos que podem ser preenchidos em massa
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'email_verified_at',
    ];

    /**
     * Atributos que devem ser ocultados
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Atributos que devem ser convertidos
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * Quadros que o usuário é dono
     */
    public function ownedBoards()
    {
        return $this->hasMany(Board::class, 'user_id');
    }

    /**
     * Quadros que o usuário é membro
     */
    public function boards()
    {
        return $this->belongsToMany(Board::class, 'board_user')
                    ->withPivot('role')
                    ->withTimestamps();
    }

    /**
     * Comentários do usuário
     */
    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Cards criados pelo usuário
     */
    public function createdCards()
    {
        return $this->hasMany(Card::class, 'user_id');
    }

    /**
     * Anexos do usuário
     */
    public function attachments()
    {
        return $this->hasMany(Attachment::class);
    }

    /**
     * Verificar se o usuário é dono do quadro
     */
    public function isBoardOwner($boardId)
    {
        return $this->ownedBoards()->where('id', $boardId)->exists();
    }

    /**
     * Verificar se o usuário é membro do quadro
     */
    public function isBoardMember($boardId)
    {
        return $this->boards()->where('board_id', $boardId)->exists();
    }

    /**
     * Obter papel do usuário no quadro
     */
    public function getBoardRole($boardId)
    {
        $board = $this->boards()->where('board_id', $boardId)->first();
        return $board ? $board->pivot->role : null;
    }
}