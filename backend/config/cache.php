<?php

use Illuminate\Support\Str;

return [
    'default' => env('CACHE_DRIVER', 'redis'),
    
    'stores' => [
        'file' => [
            'driver' => 'file',
            'path' => storage_path('framework/cache/data'),
            'lock_path' => storage_path('framework/cache/data'),
        ],
        
        'redis' => [
            'driver' => 'redis',
            'connection' => 'cache',
            'lock_connection' => 'default',
        ],
        
        'database' => [
            'driver' => 'database',
            'table' => 'cache',
            'connection' => null,
            'lock_table' => 'cache_locks',
            'lock_connection' => null,
        ],
    ],
    
    'prefix' => env('CACHE_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_cache_'),
    
    'lock' => [
        'driver' => 'file',
        'timeout' => 86400,
    ],
];