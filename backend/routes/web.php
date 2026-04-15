<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return response()->json([
        'name' => 'Boardy API',
        'version' => '1.0.0',
        'status' => 'active',
    ]);
});

Route::get('/up', function () {
    return response()->json(['status' => 'ok']);
});