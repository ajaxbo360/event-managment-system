<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckEventCapacity
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $event = $request->route('event');

        // Check if event is full
        if ($event->isFull()) {
            return response()->json([
                'message' => 'Event is at full capacity',
                'available_spots' => 0,
            ], 400);
        }

        return $next($request);
    }
}
