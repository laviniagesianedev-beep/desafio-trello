<?php

namespace App\Providers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if (config('database.default') === 'sqlite') {
            try {
                $dbPath = config('database.connections.sqlite.database');
                if ($dbPath && file_exists($dbPath) && filesize($dbPath) > 0) {
                    DB::connection('sqlite')->statement('PRAGMA journal_mode=WAL');
                    DB::connection('sqlite')->statement('PRAGMA synchronous=NORMAL');
                    DB::connection('sqlite')->statement('PRAGMA cache_size=-64000');
                    DB::connection('sqlite')->statement('PRAGMA temp_store=MEMORY');
                }
            } catch (\Throwable $e) {
                //
            }
        }
    }
}