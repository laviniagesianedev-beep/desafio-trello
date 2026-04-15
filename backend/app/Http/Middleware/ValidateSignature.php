<?php

namespace App\Http\Middleware;

use Illuminate\Routing\Middleware\ValidateSignature as Middleware;

class ValidateSignature extends Middleware
{
    /**
     * The URIs that should be excluded from signature validation.
     */
    protected $except = [
        //
    ];
}