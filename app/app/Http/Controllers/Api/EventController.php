<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Notifications\EventRegistrationConfirmation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EventController extends Controller
{
    /**
     * Get all published events
     */
    public function index(Request $request)
    {
        $query = Event::query();

        // Users see only published events, admins see all
        if (!$request->user()->isAdmin()) {
            $query->where('status', 'published');
        }

        // Filter by date range (for calendar)
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('date_time', [
                $request->start_date,
                $request->end_date,
            ]);
        }

        $events = $query->withCount('users')
            ->orderBy('date_time', 'asc')
            ->get()
            ->map(function ($event) use ($request) {
                return [
                    'id' => $event->id,
                    'name' => $event->name,
                    'description' => $event->description,
                    'date_time' => $event->date_time,
                    'duration' => $event->duration,
                    'location' => $event->location,
                    'capacity' => $event->capacity,
                    'waitlist_capacity' => $event->waitlist_capacity,
                    'status' => $event->status,
                    'registered_count' => $event->users_count,
                    // 'available_spots' => $event->availableSpots(),
                    // 'is_full' => $event->isFull(),
                    // 'is_joined' => $request->user()->hasRegisteredFor($event),
                ];
            });

        return response()->json($events);
    }

    /**
     * Get single event details
     */
    public function show(Request $request, Event $event)
    {
        if (!$request->user()->isAdmin() && $event->status !== 'published') {
            return response()->json([
                'message' => 'Event not found',
            ], 404);
        }

        return response()->json([
            'id' => $event->id,
            'name' => $event->name,
            'description' => $event->description,
            'date_time' => $event->date_time,
            'duration' => $event->duration,
            'location' => $event->location,
            'capacity' => $event->capacity,
            'waitlist_capacity' => $event->waitlist_capacity,
            'status' => $event->status,
            'registered_count' => $event->users()->count(),
            'available_spots' => $event->availableSpots(),
            'is_full' => $event->isFull(),
            'is_joined' => $request->user()->hasRegisteredFor($event),
        ]);
    }

    /**
     * Join an event
     */
    public function join(Request $request, Event $event)
    {
        $user = $request->user();
        // admin can only view not
        if ($user->isAdmin()) {
            return response()->json([
                'message' => 'Admins cannot join events. Use Nova to manage events.',
            ], 403);
        }
        // Check if event is published
        if ($event->status !== 'published') {
            return response()->json([
                'message' => 'Cannot join draft events . Event must be published first . ',
            ], 403);
        }

        // Check if already registered
        if ($user->hasRegisteredFor($event)) {
            return response()->json([
                'message' => 'You are already registered for this event',
            ], 400);
        }

        // Check for time conflicts
        if ($user->hasConflictWith($event)) {
            $conflictingEvents = $user->events()
                ->whereDate('date_time', $event->date_time->toDateString())
                ->get()
                ->filter(function ($existingEvent) use ($event) {
                    $existingEnd = $existingEvent->end_time;
                    $newEnd = $event->end_time;
                    return ($event->date_time < $existingEnd) &&
                        ($newEnd > $existingEvent->date_time);
                });

            return response()->json([
                'message' => 'You have a scheduling conflict with another event',
                'conflicting_events' => $conflictingEvents->map(function ($e) {
                    return [
                        'id' => $e->id,
                        'name' => $e->name,
                        'date_time' => $e->date_time,
                        'end_time' => $e->end_time,
                    ];
                }),
            ], 409);
        }

        // Check capacity
        if ($event->isFull()) {
            return response()->json([
                'message' => 'Event is full',
                'available_spots' => 0,
            ], 400);
        }

        // Register user with transaction
        try {
            DB::transaction(function () use ($event, $user) {
                $event->users()->attach($user->id, [
                    'registered_at' => now(),
                ]);
            });

            // Send confirmation email (queued)
            $user->notify(new EventRegistrationConfirmation($event));

            Log::info('User registered for event', [
                'user_id' => $user->id,
                'event_id' => $event->id,
                'event_name' => $event->name,
            ]);

            return response()->json([
                'message' => 'Successfully registered for event. Confirmation email sent.',
                'event' => [
                    'id' => $event->id,
                    'name' => $event->name,
                    'date_time' => $event->date_time,
                ],
            ], 201);
        } catch (\Exception $e) {
            Log::error('Event registration failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'event_id' => $event->id,
            ]);

            return response()->json([
                'message' => 'Registration failed. Please try again.',
            ], 500);
        }
    }

    /**
     * Leave an event
     */
    public function leave(Request $request, Event $event)
    {
        $user = $request->user();

        if (!$user->hasRegisteredFor($event)) {
            return response()->json([
                'message' => 'You are not registered for this event',
            ], 400);
        }

        $event->users()->detach($user->id);

        Log::info('User left event', [
            'user_id' => $user->id,
            'event_id' => $event->id,
        ]);

        return response()->json([
            'message' => 'Successfully left the event',
        ]);
    }

    /**
     * Get user's registered events
     */
    public function myEvents(Request $request)
    {
        $user = $request->user();

        $events = $user->events()
            ->orderBy('date_time', 'asc')
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'name' => $event->name,
                    'description' => $event->description,
                    'date_time' => $event->date_time,
                    'duration' => $event->duration,
                    'location' => $event->location,
                    'capacity' => $event->capacity,
                    'registered_at' => $event->pivot->registered_at,
                ];
            });

        return response()->json($events);
    }
}
