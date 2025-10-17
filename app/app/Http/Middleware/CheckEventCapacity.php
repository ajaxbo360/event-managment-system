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

        if ($event->isFull() && $event->isWaitlistFull()) {
            return response()->json([
                'message' => 'Event and waitlist are both full',
                'available_spots' => 0,
                'available_waitlist_spots' => 0,
            ], 400);
        }

        return $next($request);
    }
}
