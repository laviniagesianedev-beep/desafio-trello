<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attachment extends Model
{
    use HasFactory;

    /**
     * Atributos que podem ser preenchidos em massa
     */
    protected $fillable = [
        'card_id',
        'user_id',
        'file_path',
        'file_name',
        'file_size',
        'file_type',
    ];

    /**
     * Card ao qual o anexo pertence
     */
    public function card()
    {
        return $this->belongsTo(Card::class);
    }

    /**
     * Usuário que fez o upload
     */
    public function uploader()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Obter URL do arquivo
     */
    public function getUrlAttribute()
    {
        return asset('storage/' . $this->file_path);
    }

    /**
     * Obter tamanho formatado
     */
    public function getFormattedSizeAttribute()
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Verificar se é imagem
     */
    public function isImage()
    {
        return in_array($this->file_type, ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
    }

    /**
     * Verificar se é documento
     */
    public function isDocument()
    {
        return in_array($this->file_type, [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}