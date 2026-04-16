<?php

namespace App\Domain\Checklist\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChecklistItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'card_id',
        'content',
        'is_checked',
        'position',
    ];

    protected $casts = [
        'is_checked' => 'boolean',
    ];

    public function card()
    {
        return $this->belongsTo(\App\Domain\Cards\Models\Card::class);
    }
}