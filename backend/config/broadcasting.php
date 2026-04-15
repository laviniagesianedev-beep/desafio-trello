<?php

return [
    'default' => env('BROADCAST_DRIVER', 'redis'),
    
    'connections' => [
        'pusher' => [
            'driver' => 'pusher',
            'key' => env('PUSHER_APP_KEY'),
            'secret' => env('PUSHER_APP_SECRET'),
            'app_id' => env('PUSHER_APP_ID'),
            'options' => [
                'host' => env('PUSHER_HOST', 'api-'.env('PUSHER_APP_CLUSTER', 'mt1').'.pusher.com'),
                'port' => env('PUSHER_PORT', 443),
                'scheme' => env('PUSHER_SCHEME', 'https'),
                'encrypted' => true,
                'useTLS' => env('PUSHER_SCHEME', 'https') === 'https',
            ],
            'client_options' => [
                // Guzzle client options: https://docs.guzzlephp.org/en/stable/request-options.html
            ],
        ],
        
        'ably' => [
            'driver' => 'ably',
            'key' => env('ABLY_KEY'),
        ],
        
        'redis' => [
            'driver' => 'redis',
            'connection' => 'broadcast',
        ],
        
        'log' => [
            'driver' => 'log',
            'channel' => env('BROADCAST_LOG_CHANNEL', 'stack'),
        ],
        
        'null' => [
            'driver' => 'null',
        ],
    ],
];