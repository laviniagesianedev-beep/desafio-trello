<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('lists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->unsignedInteger('position')->default(1);
            $table->timestamps();

            // Índices para performance
            $table->index(['board_id', 'position']);
            $table->index('position');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lists');
    }
};